window.onload = function () {
  const canvas = document.getElementById("network");
  const ctx = canvas.getContext("2d");
  const log = document.getElementById("log");

  const addNodeBtn = document.getElementById("addNodeBtn");
  const addEdgeBtn = document.getElementById("addEdgeBtn");
  const simulateBtn = document.getElementById("simulateBtn");
  const clearBtn = document.getElementById("clearBtn");
  const showTableBtn = document.getElementById("showTableBtn");

  const routingTableDiv = document.getElementById("routingTable");
  const tableBody = document.querySelector("#table tbody");

  let addNodeMode = false;
  let addEdgeMode = false;
  let simulateMode = false;

  const nodes = [
    { x: 100, y: 100, name: "A" },
    { x: 300, y: 80, name: "B" },
    { x: 500, y: 150, name: "C" },
    { x: 200, y: 300, name: "D" },
    { x: 400, y: 300, name: "E" },
    { x: 650, y: 250, name: "F" },
    { x: 800, y: 150, name: "G" },
  ];

  const edges = [
    [0, 1, 4],
    [0, 3, 2],
    [1, 2, 5],
    [1, 4, 10],
    [3, 4, 3],
    [4, 2, 2],
    [4, 5, 7],
    [2, 5, 1],
    [5, 6, 3],
  ];

  let selected = [];
  let lastPath = [];

  // 🟢 Draw Network
  function drawNetwork(hoveredNode = -1) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Edges
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 2;
    edges.forEach(([a, b, w]) => {
      const n1 = nodes[a],
        n2 = nodes[b];
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
      ctx.fillStyle = "#aaa";
      ctx.font = "12px Arial";
      ctx.fillText(w, (n1.x + n2.x) / 2, (n1.y + n2.y) / 2);
    });

    // Routers (small squares)
    nodes.forEach((n) => {
      ctx.fillStyle = "#ff7b72";
      ctx.fillRect(n.x - 5, n.y - 40, 10, 10);
    });

    // Draw Nodes
    nodes.forEach((n, index) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = index === hoveredNode ? "#1f6feb" : "#238636";
      ctx.shadowColor = index === hoveredNode ? "#58a6ff" : "transparent";
      ctx.shadowBlur = index === hoveredNode ? 20 : 0;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.fillText(n.name, n.x - 5, n.y + 5);
    });
  }

  // Detect clicked node
  function getClickedNode(x, y) {
    return nodes.findIndex((n) => Math.hypot(n.x - x, n.y - y) < 20);
  }

  // Dijkstra’s algorithm
  function dijkstra(start, end) {
    const dist = Array(nodes.length).fill(Infinity);
    const prev = Array(nodes.length).fill(null);
    dist[start] = 0;
    const visited = new Set();

    while (visited.size < nodes.length) {
      let u = -1,
        best = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        if (!visited.has(i) && dist[i] < best) {
          best = dist[i];
          u = i;
        }
      }
      if (u === -1) break;
      visited.add(u);

      edges.forEach(([a, b, w]) => {
        if (a === u && dist[b] > dist[a] + w) {
          dist[b] = dist[a] + w;
          prev[b] = a;
        }
        if (b === u && dist[a] > dist[b] + w) {
          dist[a] = dist[b] + w;
          prev[a] = b;
        }
      });
    }

    let path = [];
    for (let at = end; at !== null; at = prev[at]) path.push(at);
    path.reverse();
    return path;
  }

  // Animate routing
  function animateRouting(path) {
    lastPath = path;
    routingTableDiv.classList.add("hidden");

    let i = 0;
    drawNetwork();
    log.innerText = "Routing simulation started...";

    function nextHop() {
      if (i >= path.length - 1) {
        log.innerText = "✅ Packet reached destination!";
        return;
      }
      const from = nodes[path[i]],
        to = nodes[path[i + 1]];
      let progress = 0;

      log.innerText = `Router ${from.name} → ${to.name}`;

      function animateSegment() {
        drawNetwork();
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.shadowColor = "gold";
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          from.x + (to.x - from.x) * progress,
          from.y + (to.y - from.y) * progress,
          7,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "cyan";
        ctx.fill();

        progress += 0.02;
        if (progress <= 1) {
          requestAnimationFrame(animateSegment);
        } else {
          i++;
          setTimeout(nextHop, 300);
        }
      }
      animateSegment();
    }
    nextHop();
  }

  // Show routing table
  function showRoutingTable() {
    if (lastPath.length === 0) {
      alert("⚠ Run a routing simulation first!");
      return;
    }

    routingTableDiv.classList.remove("hidden");
    tableBody.innerHTML = "";

    for (let i = 0; i < lastPath.length - 1; i++) {
      const from = nodes[lastPath[i]];
      const to = nodes[lastPath[i + 1]];
      const edge = edges.find(
        (e) =>
          (e[0] === lastPath[i] && e[1] === lastPath[i + 1]) ||
          (e[1] === lastPath[i] && e[0] === lastPath[i + 1])
      );
      const weight = edge ? edge[2] : "?";
      const row = `<tr><td>${i + 1}</td><td>${from.name}</td><td>${to.name}</td><td>${weight}</td></tr>`;
      tableBody.innerHTML += row;
    }
  }

  // 🟢 Canvas Click Handler
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    const nodeIndex = getClickedNode(x, y);

    // Add Node Mode
    if (addNodeMode) {
      const name = prompt("Enter node name:");
      if (!name) return;
      nodes.push({ x, y, name: name.toUpperCase() });
      log.innerText = `🟢 Node ${name.toUpperCase()} added`;
      drawNetwork();
      return;
    }

    // Add Edge Mode
    if (addEdgeMode) {
      if (nodeIndex === -1) return;
      selected.push(nodeIndex);
      if (selected.length === 2) {
        const weight = parseInt(prompt("Enter edge weight:"), 10);
        if (!isNaN(weight)) {
          edges.push([selected[0], selected[1], weight]);
          log.innerText = `🔗 Edge added between ${nodes[selected[0]].name} and ${nodes[selected[1]].name}`;
        }
        selected = [];
        drawNetwork();
      }
      return;
    }

    // Simulate Mode
    if (simulateMode && nodeIndex !== -1) {
      selected.push(nodeIndex);
      if (selected.length === 2) {
        const path = dijkstra(selected[0], selected[1]);
        animateRouting(path);
        selected = [];
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    const hoveredNode = getClickedNode(x, y);
    drawNetwork(hoveredNode);
  });

  // 🟣 Button Handlers
  addNodeBtn.addEventListener("click", () => {
    addNodeMode = !addNodeMode;
    addEdgeMode = simulateMode = false;
    addNodeBtn.classList.toggle("active", addNodeMode);
    addEdgeBtn.classList.remove("active");
    simulateBtn.classList.remove("active");
    log.innerText = addNodeMode
      ? "🟢 Click anywhere on canvas to add a new node"
      : "Add Node mode off";
  });

  addEdgeBtn.addEventListener("click", () => {
    addEdgeMode = !addEdgeMode;
    addNodeMode = simulateMode = false;
    addEdgeBtn.classList.toggle("active", addEdgeMode);
    addNodeBtn.classList.remove("active");
    simulateBtn.classList.remove("active");
    selected = [];
    log.innerText = addEdgeMode
      ? "🔗 Select two nodes to connect"
      : "Add Edge mode off";
  });

  simulateBtn.addEventListener("click", () => {
    simulateMode = !simulateMode;
    addNodeMode = addEdgeMode = false;
    simulateBtn.classList.toggle("active", simulateMode);
    addNodeBtn.classList.remove("active");
    addEdgeBtn.classList.remove("active");
    log.innerText = simulateMode
      ? "▶ Click two nodes to simulate routing"
      : "Simulation mode off";
  });

  showTableBtn.addEventListener("click", showRoutingTable);

  clearBtn.addEventListener("click", () => {
    nodes.length = 0;
    edges.length = 0;
    selected = [];
    lastPath = [];
    routingTableDiv.classList.add("hidden");
    log.innerText = "🧹 Network cleared!";
    drawNetwork();
  });

  drawNetwork();
};
