#!/usr/bin/env node
/*
 * Development stand-in for the ASP.NET backend: the same /api endpoints, a
 * SignalR hub at /sessionHub (JSON protocol over WebSockets), and a stand-in
 * /js/tafqit.min.js. Data lives in memory and resets on restart.
 *
 *   npm run mock            # http://localhost:5080
 *
 * It is seeded with today's two sessions in hall 6 of the investment court,
 * built from the real 27/01/2026 roll, plus a few sessions on other days.
 */
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import http from "node:http"
import { WebSocketServer } from "ws"

const PORT = Number(process.env.MOCK_PORT ?? 5080)
const roll = JSON.parse(readFileSync(new URL("./roll-2026-01-27.json", import.meta.url), "utf8"))

// ---------------------------------------------------------------------------
// Data

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

const courts = [
  { courtId: 1, courtName: "محكمة الاستثمار والتجارة بمسقط" },
  { courtId: 2, courtName: "المحكمة الابتدائية بمسقط" },
]
const halls = {
  1: [
    { hallId: 6, hallName: "قاعة محكمة الاستثمار 6" },
    { hallId: 7, hallName: "قاعة محكمة الاستثمار 7" },
  ],
  2: [
    { hallId: 1, hallName: "القاعة 1" },
    { hallId: 2, hallName: "القاعة 2" },
  ],
}
const panels = {
  1: [
    { customPanelId: 1, panelName: "الدائرة الاستئنافية الأولى" },
    { customPanelId: 2, panelName: "الدائرة الاستئنافية الثانية" },
  ],
}

let nextSessionId = 1
let nextCaseId = 1
/** @type {Map<number, any>} */
const sessions = new Map()

const pad = (n) => String(n).padStart(2, "0")
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

function hearingInfoFor(courtId, hallId, date, judges = [], clerks = []) {
  const [y, m, d] = date.split("-").map(Number)
  return {
    courtName: courts.find((c) => c.courtId === courtId)?.courtName ?? "",
    courtHall: halls[courtId]?.find((h) => h.hallId === hallId)?.hallName ?? "",
    hearingDate: `${pad(d)}/${pad(m)}/${y}`,
    hearingDay: DAYS[new Date(y, m - 1, d).getDay()],
    judges,
    clerks,
  }
}

function createSession({ courtId, hallId, date, time = null, order = 1, title = null, cases = [], judges, clerks, hearingInfo }) {
  const sessionId = nextSessionId++
  const session = {
    sessionId,
    courtId,
    hallId,
    sessionDate: date,
    sessionTime: time,
    sessionOrder: order,
    sessionTitle: title,
    hearingInfo: hearingInfo ?? hearingInfoFor(courtId, hallId, date, judges, clerks),
    cases: cases.map((c, i) => ({
      caseId: nextCaseId++,
      rowNumber: i + 1,
      caseNumber: c.caseNumber,
      publicProsecutionNumber: c.publicProsecutionNumber ?? null,
      plaintiff: c.plaintiff,
      defendant: c.defendant,
      caseStatus: "in-review",
    })),
  }
  sessions.set(sessionId, session)
  return session
}

const today = addDays(0)
createSession({ courtId: 1, hallId: 6, date: today, time: "09:00:00", order: 1, title: "القضايا المحجوزة للحكم", cases: roll.judgment, judges: roll.judges, clerks: roll.clerks })
createSession({ courtId: 1, hallId: 6, date: today, time: "10:00:00", order: 2, title: "قضايا المناقشة والمرافعة", cases: roll.pleading, judges: roll.judges, clerks: roll.clerks })
createSession({
  courtId: 2,
  hallId: 1,
  date: addDays(1),
  time: "08:30:00",
  order: 1,
  cases: [
    { caseNumber: "377/2201/2026", publicProsecutionNumber: "1450/2026", plaintiff: "الادعاء العام", defendant: "دانيال كوفي أوسي" },
    { caseNumber: "402/2201/2026", publicProsecutionNumber: "1502/2026", plaintiff: "الادعاء العام", defendant: "ماركوس بيل" },
    { caseNumber: "419/2201/2026", plaintiff: "أمل بنت راشد الحارثية", defendant: "شركة الهلال للعقارات" },
  ],
  judges: ["فضيلة القاضي: سالم بن خلفان الراشدي"],
  clerks: ["أمين السر: يوسف بن سعيد العامري"],
})
createSession({ courtId: 2, hallId: 2, date: addDays(-2), time: "09:00:00", order: 1, cases: roll.pleading.slice(0, 6) })
createSession({ courtId: 1, hallId: 7, date: addDays(5), time: "09:30:00", order: 1, cases: roll.judgment.slice(0, 4) })

function summary(s) {
  const count = (status) => s.cases.filter((c) => c.caseStatus === status).length
  return {
    sessionId: s.sessionId,
    courtId: s.courtId,
    hallId: s.hallId,
    sessionTitle: s.sessionTitle,
    sessionOrder: s.sessionOrder,
    sessionTime: s.sessionTime,
    totalCases: s.cases.length,
    discussedCases: count("discussed"),
    rulingIssuedCases: count("ruling-issued"),
    inProgressCases: count("in-progress"),
    hearingInfo: s.hearingInfo,
  }
}

function detail(s) {
  return {
    sessionId: s.sessionId,
    courtId: s.courtId,
    hallId: s.hallId,
    courtName: s.hearingInfo.courtName,
    hallName: s.hearingInfo.courtHall,
    sessionDate: `${s.sessionDate}T00:00:00`,
    sessionTitle: s.sessionTitle,
    sessionOrder: s.sessionOrder,
    sessionTime: s.sessionTime,
    hearingInfo: s.hearingInfo,
    cases: s.cases,
  }
}

// ---------------------------------------------------------------------------
// SignalR hub (JSON protocol over WebSockets)

const RS = "\x1e"
/** @type {Map<number, Set<import("ws").WebSocket>>} */
const groups = new Map()

function broadcastStatus(sessionId, caseId, status, modifiedBy) {
  const msg = JSON.stringify({ type: 1, target: "CaseStatusChanged", arguments: [caseId, status, modifiedBy] }) + RS
  for (const ws of groups.get(sessionId) ?? []) if (ws.readyState === ws.OPEN) ws.send(msg)
}

const wss = new WebSocketServer({ noServer: true })
wss.on("connection", (ws) => {
  let handshaken = false
  const ping = setInterval(() => ws.readyState === ws.OPEN && ws.send(JSON.stringify({ type: 6 }) + RS), 10_000)
  ws.on("close", () => {
    clearInterval(ping)
    for (const members of groups.values()) members.delete(ws)
  })
  ws.on("message", (data) => {
    for (const frame of data.toString().split(RS).filter(Boolean)) {
      const msg = JSON.parse(frame)
      if (!handshaken) {
        handshaken = true
        ws.send("{}" + RS)
        continue
      }
      if (msg.type === 1 && msg.target === "JoinSession") {
        const id = Number(msg.arguments[0])
        if (!groups.has(id)) groups.set(id, new Set())
        groups.get(id).add(ws)
      }
      if (msg.type === 1 && msg.invocationId) {
        ws.send(JSON.stringify({ type: 3, invocationId: msg.invocationId, result: null }) + RS)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// HTTP

// A plain-Arabic stand-in for the real /js/tafqit.min.js (global `tafqit(n)`).
const TAFQIT_STUB = `/* mock stand-in for tafqit.min.js */
(function () {
  var ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  var teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  var tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  var hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  function below100(n) { if (n < 10) return ones[n]; if (n < 20) return teens[n - 10]; return n % 10 ? ones[n % 10] + " و" + tens[Math.floor(n / 10)] : tens[n / 10]; }
  function below1000(n) { return [hundreds[Math.floor(n / 100)], below100(n % 100)].filter(Boolean).join(" و"); }
  window.tafqit = function (n) {
    n = Number(n); if (!n) return "صفر";
    var t = Math.floor(n / 1000), r = n % 1000;
    var head = t === 0 ? "" : t === 1 ? "ألف" : t === 2 ? "ألفان" : t < 11 ? ones[t] + " آلاف" : below1000(t) + " ألف";
    return [head, below1000(r)].filter(Boolean).join(" و");
  };
})();
`

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "content-type": type })
  res.end(typeof body === "string" ? body : JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

const DOC_SAMPLE = [
  { caseNumber: "1503/7103/2024", plaintiff: "شركة الموج مسقط ش م ع م", defendant: "مديحة بنت علي بن حميد الكليبية" },
  { caseNumber: "209/7103/2025", plaintiff: "العربية للطيران", defendant: "ناصر عثمان ناصر عبد الرحمن" },
  { caseNumber: "224/7103/2025", plaintiff: "أروى بنت مبارك بن عبيد الزعابية", defendant: "ريزون العقارية ش م م" },
]

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  const q = url.searchParams
  let m

  try {
    if (path === "/js/tafqit.min.js") return send(res, 200, TAFQIT_STUB, "text/javascript; charset=utf-8")

    // SignalR negotiation
    if (path === "/sessionHub/negotiate" && req.method === "POST") {
      const id = randomUUID()
      return send(res, 200, {
        negotiateVersion: 1,
        connectionId: id,
        connectionToken: id,
        availableTransports: [{ transport: "WebSockets", transferFormats: ["Text", "Binary"] }],
      })
    }

    if (req.method === "GET" && path === "/api/session/courts") return send(res, 200, courts)
    if (req.method === "GET" && (m = path.match(/^\/api\/session\/courts\/(\d+)\/halls$/))) return send(res, 200, halls[m[1]] ?? [])
    if (req.method === "GET" && (m = path.match(/^\/api\/session\/courts\/(\d+)\/panels$/))) return send(res, 200, panels[m[1]] ?? [])

    if (req.method === "GET" && path === "/api/session/calendar") {
      const month = q.get("month") ?? ""
      const courtId = Number(q.get("courtId")) || null
      const hallId = Number(q.get("hallId")) || null
      const list = [...sessions.values()]
        .filter((s) => s.sessionDate.startsWith(month) && (!courtId || s.courtId === courtId) && (!hallId || s.hallId === hallId))
        .map((s) => ({
          sessionId: s.sessionId,
          courtId: s.courtId,
          hallId: s.hallId,
          courtName: s.hearingInfo.courtName,
          hallName: s.hearingInfo.courtHall,
          sessionDate: `${s.sessionDate}T00:00:00`,
          sessionTime: s.sessionTime,
          sessionTitle: s.sessionTitle,
          sessionOrder: s.sessionOrder,
          casesCount: s.cases.length,
        }))
      return send(res, 200, list)
    }

    if (req.method === "GET" && path === "/api/session/sessions") {
      const list = [...sessions.values()]
        .filter((s) => s.courtId === Number(q.get("courtId")) && s.hallId === Number(q.get("hallId")) && s.sessionDate === q.get("date"))
        .sort((a, b) => a.sessionOrder - b.sessionOrder)
        .map(summary)
      return send(res, 200, list)
    }

    if ((m = path.match(/^\/api\/session\/sessions\/(\d+)$/))) {
      const session = sessions.get(Number(m[1]))
      if (!session) return send(res, 404, { message: "Session not found" })
      if (req.method === "GET") return send(res, 200, detail(session))
      if (req.method === "DELETE") {
        sessions.delete(session.sessionId)
        return send(res, 200, { success: true })
      }
    }

    if (req.method === "PUT" && (m = path.match(/^\/api\/session\/sessions\/(\d+)\/cases\/(\d+)\/status$/))) {
      const session = sessions.get(Number(m[1]))
      const c = session?.cases.find((x) => x.caseId === Number(m[2]))
      if (!c) return send(res, 404, { message: "Case not found" })
      const { status, modifiedBy } = JSON.parse((await readBody(req)).toString())
      c.caseStatus = status
      broadcastStatus(session.sessionId, c.caseId, status, modifiedBy)
      return send(res, 200, { success: true, caseId: c.caseId, status })
    }

    if (req.method === "POST" && path === "/api/session/sessions") {
      const body = JSON.parse((await readBody(req)).toString())
      const s = createSession({
        courtId: body.courtId,
        hallId: body.hallId,
        date: body.sessionDate,
        time: body.sessionTime ? `${body.sessionTime.slice(0, 5)}:00` : null,
        order: body.sessionOrder,
        title: body.sessionTitle,
        cases: body.cases ?? [],
        hearingInfo: body.hearingInfo,
      })
      return send(res, 200, { sessionId: s.sessionId })
    }

    if (req.method === "POST" && path === "/api/session/investment/sessions") {
      const body = JSON.parse((await readBody(req)).toString())
      // Panel 2 has nothing listed, to exercise the "no cases" path.
      if (body.customPanelId !== 1) return send(res, 404, { message: "No cases found" })
      const s = createSession({
        courtId: body.courtId,
        hallId: body.hallId,
        date: body.sessionDate,
        time: body.sessionTime,
        title: "جلسة الدائرة الاستئنافية",
        cases: roll.judgment.slice(0, 10),
        judges: roll.judges,
        clerks: roll.clerks,
      })
      return send(res, 200, { sessionId: s.sessionId, casesCount: s.cases.length })
    }

    if (req.method === "POST" && path === "/api/document/upload-and-create-session") {
      const form = await new Request("http://mock", { method: "POST", headers: req.headers, body: await readBody(req) }).formData()
      const file = form.get("file")
      const s = createSession({
        courtId: Number(form.get("courtId")),
        hallId: Number(form.get("hallId")),
        date: String(form.get("sessionDate")),
        time: form.get("sessionTime") ? `${form.get("sessionTime")}:00` : null,
        order: Number(form.get("sessionOrder")) || 1,
        title: String(form.get("sessionTitle") || "") || null,
        cases: DOC_SAMPLE,
      })
      console.log(`  received ${file?.name} (${file?.size} bytes)`)
      return send(res, 200, { sessionId: s.sessionId, extractedCases: s.cases.length })
    }

    send(res, 404, { message: `No mock for ${req.method} ${path}` })
  } catch (error) {
    console.error(error)
    send(res, 500, { message: String(error) })
  }
})

server.on("upgrade", (req, socket, head) => {
  if (new URL(req.url, "http://x").pathname === "/sessionHub") {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req))
  } else {
    socket.destroy()
  }
})

server.listen(PORT, () => {
  console.log(`Mock backend on http://localhost:${PORT} (${sessions.size} sessions, today = ${today})`)
})
