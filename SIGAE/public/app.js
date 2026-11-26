fetch("/api/saude")
  .then(r => r.json())
  .then(d => document.getElementById("status").textContent = "API: " + d.status);
