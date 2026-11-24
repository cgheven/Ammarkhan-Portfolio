(function () {
  "use strict"
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  var $ = function (s, c) { return (c || document).querySelector(s) }
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)) }
  var body = document.body

  /* ---------- intro: constellation canvas + click to enter ---------- */
  var intro = $("#intro")
  function enter() {
    if (!intro || intro.classList.contains("out")) return
    intro.classList.add("out")
    body.classList.remove("locked")
    window.scrollTo(0, 0)
    setTimeout(function () { intro.style.display = "none" }, 1100)
  }
  if (intro) {
    intro.addEventListener("click", enter)
    intro.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enter() } })
    window.addEventListener("wheel", enter, { passive: true, once: true })
    window.addEventListener("touchmove", enter, { passive: true, once: true })
    intro.focus()
  }

  function fit(c) {
    var d = Math.min(window.devicePixelRatio || 1, 2), r = c.getBoundingClientRect()
    c.width = Math.max(1, r.width * d); c.height = Math.max(1, r.height * d)
    var x = c.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0)
    return { x: x, w: r.width, h: r.height }
  }

  // constellation: small triangles of connected dots drifting in the intro
  ;(function () {
    var c = $("#introCanvas"); if (!c) return
    var s = fit(c), clusters = []
    function make() {
      s = fit(c); clusters = []
      var n = Math.round(s.w * s.h / 52000)
      for (var i = 0; i < n; i++) {
        var cx = Math.random() * s.w, cy = Math.random() * s.h, pts = []
        for (var k = 0; k < 3 + (Math.random() * 2 | 0); k++) pts.push({ x: cx + (Math.random() - .5) * 120, y: cy + (Math.random() - .5) * 100, r: Math.random() * 1.6 + .6 })
        clusters.push({ pts: pts, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12, a: Math.random() * .22 + .08 })
      }
    }
    make(); window.addEventListener("resize", make)
    function tick() {
      if (intro.classList.contains("out")) return
      s.x.clearRect(0, 0, s.w, s.h)
      clusters.forEach(function (cl) {
        cl.pts.forEach(function (p) { p.x += cl.vx; p.y += cl.vy; if (p.x < -50) p.x = s.w + 50; if (p.x > s.w + 50) p.x = -50; if (p.y < -50) p.y = s.h + 50; if (p.y > s.h + 50) p.y = -50 })
        s.x.strokeStyle = "rgba(140,150,255," + cl.a + ")"; s.x.lineWidth = 1
        s.x.beginPath(); cl.pts.forEach(function (p, i) { i ? s.x.lineTo(p.x, p.y) : s.x.moveTo(p.x, p.y) }); s.x.closePath(); s.x.stroke()
        cl.pts.forEach(function (p) { s.x.fillStyle = "rgba(190,196,255," + (cl.a + .25) + ")"; s.x.beginPath(); s.x.arc(p.x, p.y, p.r, 0, 6.283); s.x.fill() })
      })
      requestAnimationFrame(tick)
    }
    if (!reduce) tick()
  })()

  /* ---------- fixed starfield ---------- */
  ;(function () {
    var c = $("#stars"); if (!c) return
    var s = fit(c), stars = []
    function make() { s = fit(c); stars = []; for (var i = 0; i < 90; i++) stars.push({ x: Math.random() * s.w, y: Math.random() * s.h, r: Math.random() * 1.1 + .3, a: Math.random() * .45 + .1, v: Math.random() * .08 + .02, p: Math.random() * 6 }) }
    make(); window.addEventListener("resize", make)
    function tick(t) {
      s.x.clearRect(0, 0, s.w, s.h)
      stars.forEach(function (st) {
        st.y -= st.v; if (st.y < -2) { st.y = s.h + 2; st.x = Math.random() * s.w }
        s.x.fillStyle = "rgba(170,180,255," + (st.a * (.6 + .4 * Math.sin(t / 1400 + st.p))) + ")"
        s.x.beginPath(); s.x.arc(st.x, st.y, st.r, 0, 6.283); s.x.fill()
      })
      requestAnimationFrame(tick)
    }
    if (reduce) { s.x.fillStyle = "rgba(170,180,255,.3)"; stars.forEach(function (st) { s.x.fillRect(st.x, st.y, st.r, st.r) }) } else requestAnimationFrame(tick)
  })()

  /* ---------- hero dotted globe ---------- */
  ;(function () {
    var c = $("#globe"); if (!c) return
    var s = fit(c), pts = [], N = 520, rot = 0
    for (var i = 0; i < N; i++) { var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; pts.push([Math.cos(th) * r, y, Math.sin(th) * r]) }
    window.addEventListener("resize", function () { s = fit(c) })
    function draw() {
      s.x.clearRect(0, 0, s.w, s.h)
      var R = Math.min(s.w * .62, s.h * .95), cx = s.w / 2, cy = s.h * .62, cr = Math.cos(rot), sr = Math.sin(rot)
      pts.forEach(function (p) {
        var x = p[0] * cr + p[2] * sr, z = -p[0] * sr + p[2] * cr, y = p[1]
        var sc = (z + 1.4) / 2.4, a = Math.max(0, (z + .3)) * .5
        if (a <= 0) return
        s.x.fillStyle = "rgba(150,160,255," + a * .75 + ")"
        s.x.beginPath(); s.x.arc(cx + x * R, cy + y * R * .95, 1.1 * sc + .3, 0, 6.283); s.x.fill()
      })
      rot += .0016
      if (!reduce) requestAnimationFrame(draw)
    }
    draw()
  })()

  /* ---------- word-by-word reveal ---------- */
  function words(el) {
    var txt = el.getAttribute("data-text") || "", out = [], parts = txt.split(/(\[\[.*?\]\])/)
    parts.forEach(function (p) {
      var acc = /^\[\[/.test(p); p = p.replace(/^\[\[|\]\]$/g, "")
      p.split(/\s+/).filter(Boolean).forEach(function (w) { var sp = document.createElement("span"); sp.className = "w" + (acc ? " accent" : ""); sp.textContent = w; out.push(sp) })
    })
    out.forEach(function (sp, i) { el.appendChild(sp); if (i < out.length - 1) el.appendChild(document.createTextNode(" ")) })
    return out
  }
  var stmt = $("#statementText"), foot = $("#footerStatement")
  var stmtWords = stmt ? words(stmt) : [], footWords = foot ? words(foot) : []
  if (reduce) stmtWords.concat(footWords).forEach(function (w) { w.classList.add("lit") })

  /* ---------- scroll-driven effects ---------- */
  var nav = $("#nav"), vh = window.innerHeight
  var strip = $$(".tcard"), pars = $$("[data-par]"), tilts = $$(".tilt"), zooms = $$(".uic-img,.post-img img")
  var pill = $("#pillText"), pillMap = [["#home", "Hi there! 👋"], ["#about", "About me"], ["#whatido", "What I do"], ["#ventures", "My ventures"], ["#hire", "Need custom VFX?"], ["#story", "My story"], ["#connect", "Follow along"], ["#contact", "Click to chat"]]
  var pillNow = pillMap[0][1], ticking = false

  function setPill(t) {
    if (!pill || t === pillNow) return
    pillNow = t; pill.classList.add("swap")
    setTimeout(function () { pill.textContent = t; pill.classList.remove("swap") }, 220)
  }
  function litBy(list, el, startK, endK) {
    if (!list.length) return
    var r = el.getBoundingClientRect(), p = (vh * startK - r.top) / (vh * startK - vh * endK + r.height * .5)
    p = Math.max(0, Math.min(1, p)); var n = Math.round(p * list.length)
    list.forEach(function (w, i) { w.classList.toggle("lit", i < n) })
  }
  function update() {
    ticking = false
    var y = window.scrollY
    nav.classList.toggle("scrolled", y > 20)
    if (!reduce) {
      strip.forEach(function (c) {
        var s = parseFloat(c.getAttribute("data-s")) || .1, base = c.className.match(/t(\d)/)[1]
        var rots = { 1: -9, 2: 6, 3: -5, 4: 8, 5: -8 }, r = rots[base]
        c.style.transform = "translateY(" + (-y * s) + "px) rotate(" + (r + y * (r > 0 ? -.006 : .006)) + "deg)"
      })
      pars.forEach(function (el) {
        var rc = el.getBoundingClientRect(), k = parseFloat(el.getAttribute("data-par")) || .05
        if (rc.bottom < -200 || rc.top > vh + 200) return
        var off = (rc.top + rc.height / 2 - vh / 2) * -k
        el.style.transform = "translateY(" + off.toFixed(1) + "px)"
      })
    }
    if (!reduce) {
      tilts.forEach(function (t) {
        var r = t.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return
        var d = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); d = Math.max(-1, Math.min(1, d))
        var a = Math.abs(d)
        t.style.setProperty("--ry", (-(5 + 17 * a)).toFixed(2) + "deg")
        t.style.setProperty("--rx", (2 + d * 7).toFixed(2) + "deg")
        t.style.setProperty("--sc", (1 - .08 * a).toFixed(3))
      })
      zooms.forEach(function (im) {
        var r = im.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return
        var d = Math.abs((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2))
        im.style.setProperty("--iz", (1 + .16 * Math.min(1, d)).toFixed(3))
      })
    }
    if (stmt && !reduce) litBy(stmtWords, stmt, .86, .4)
    if (foot && !reduce) litBy(footWords, foot, .98, .62)
    for (var i = pillMap.length - 1; i >= 0; i--) {
      var t = $(pillMap[i][0]); if (t && t.getBoundingClientRect().top < vh * .5) { setPill(pillMap[i][1]); break }
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
  window.addEventListener("scroll", req, { passive: true })
  window.addEventListener("resize", function () { vh = window.innerHeight; req() })
  update()

  /* reveal on scroll */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } }) }, { threshold: .14, rootMargin: "0px 0px -6% 0px" })
    $$(".rv").forEach(function (el) { io.observe(el) })
  } else $$(".rv").forEach(function (el) { el.classList.add("in") })

  /* ---------- hero reel: auto-scroll, drag/touch/wheel to scroll ---------- */
  ;(function () {
    var reel = $("#reel"), track = $("#reelTrack"); if (!reel || !track) return
    var kids = Array.prototype.slice.call(track.children)
    kids.forEach(function (k) { var c = k.cloneNode(true); c.setAttribute("aria-hidden", "true"); track.appendChild(c) })
    var paused = false, resume = 0, down = false, sx = 0, sl = 0
    function half() { return track.scrollWidth / 2 }
    function stop() { paused = true; clearTimeout(resume); resume = setTimeout(function () { paused = false }, 2500) }
    reel.addEventListener("mouseenter", function () { paused = true })
    reel.addEventListener("mouseleave", function () { if (!down) paused = false })
    var tapCard = null, moved = 0
    reel.addEventListener("pointerdown", function (e) { down = true; moved = 0; tapCard = e.target.closest ? e.target.closest(".rcard2") : null; sx = e.clientX; sl = reel.scrollLeft; reel.classList.add("drag"); reel.setPointerCapture(e.pointerId) })
    reel.addEventListener("pointermove", function (e) { if (down) { moved = Math.max(moved, Math.abs(e.clientX - sx)); reel.scrollLeft = sl - (e.clientX - sx) } })
    function up() { down = false; reel.classList.remove("drag"); stop(); if (moved < 6 && tapCard && tapCard.dataset.href) window.open(tapCard.dataset.href, "_blank", "noopener"); tapCard = null }
    reel.addEventListener("pointerup", up); reel.addEventListener("pointercancel", up)
    reel.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.href) { e.preventDefault(); window.open(e.target.dataset.href, "_blank", "noopener") } })
    reel.addEventListener("wheel", function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop() }, { passive: true })
    reel.addEventListener("touchstart", stop, { passive: true })
    var cardsAll = Array.prototype.slice.call(track.children)
    function arc() {
      var rr = reel.getBoundingClientRect(), mid = rr.left + rr.width / 2, half2 = rr.width / 2
      cardsAll.forEach(function (c) {
        var b = c.getBoundingClientRect(); if (b.right < rr.left - 200 || b.left > rr.right + 200) return
        var n = ((b.left + b.width / 2) - mid) / half2; n = Math.max(-1.7, Math.min(1.7, n))
        var rot = n * 14, ty = n * n * 42 - 6, sc = 1 - .05 * n * n
        c.style.transform = "translateY(" + ty.toFixed(1) + "px) rotate(" + rot.toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")"
      })
    }
    function tick() {
      arc()
      if (!paused && !down && !reduce) reel.scrollLeft += .6
      var h = half(); if (reel.scrollLeft >= h) reel.scrollLeft -= h; else if (reel.scrollLeft <= 0 && down) reel.scrollLeft += h
      requestAnimationFrame(tick)
    }
    reel.scrollLeft = 1; requestAnimationFrame(tick)
  })()

  /* ---------- mobile menu ---------- */
  var burger = $("#burger"), links = $("#navLinks")
  function menu(o) { links.classList.toggle("open", o); burger.setAttribute("aria-expanded", o) }
  burger.addEventListener("click", function () { menu(!links.classList.contains("open")) })
  $$("#navLinks a").forEach(function (a) { a.addEventListener("click", function () { menu(false) }) })
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") menu(false) })

  /* ---------- story slider (real story, from cgheven.com/ammar-khan) ---------- */
  var STORY = [
    ["The problem.", "Good VFX assets were locked behind expensive packs. Most artists I knew, especially students, could not afford them."],
    ["So I made my own.", "I started simulating effects and sharing them for free. People around the world used them in their edits, ads and films."],
    ["CGHEVEN today.", "A library of real VFX with free 1K and 2K, free add-ons and free tutorials. Pro keeps it running."]
  ]
  var si = 0, copy = $(".story-copy"), dots = $$("#storyDots i")
  function show(n) {
    si = (n + STORY.length) % STORY.length
    copy.classList.add("swap")
    setTimeout(function () {
      $("#storyTitle").textContent = STORY[si][0]; $("#storyText").textContent = STORY[si][1]
      dots.forEach(function (d, i) { d.classList.toggle("on", i === si) }); copy.classList.remove("swap")
    }, 300)
  }
  if ($("#sPrev")) $("#sPrev").addEventListener("click", function () { show(si - 1) })
  if ($("#sNext")) $("#sNext").addEventListener("click", function () { show(si + 1) })
  dots.forEach(function (d, i) { d.addEventListener("click", function () { show(i) }) })

  var form = $("#ctForm")
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault()
    var f = form.elements, err = $("#ctErr")
    var ok = f.name.value.trim() && /^\S+@\S+\.\S+$/.test(f.email.value.trim()) && f.message.value.trim()
    err.hidden = !!ok; if (!ok) return
    var subject = "Project enquiry: " + f.need.value
    var body = "Name: " + f.name.value.trim() + "\nEmail: " + f.email.value.trim() + "\nNeed: " + f.need.value + "\nBudget: " + f.budget.value + "\n\n" + f.message.value.trim()
    window.location.href = "mailto:contact@cgheven.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body)
  })

  $("#year").textContent = new Date().getFullYear()
})()
