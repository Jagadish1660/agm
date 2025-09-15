// admin.js (cleaned & fixed)
document.addEventListener("DOMContentLoaded", () => {
  // constants (period fixed by your request)
  const START = new Date("2025-09-07"); // Sunday
  const END = new Date("2026-08-16");   // Sunday
  const sundays = getSundaysBetween(START, END); // <-- ensure function exists
  const totalWeeks = sundays.length;

  // UI elements
  const loginForm = document.getElementById("adminLoginForm");
  const loginCard = document.getElementById("loginCard");
  const adminArea = document.getElementById("adminArea");

  const addMemberForm = document.getElementById("addMemberForm");
  const membersList = document.getElementById("membersList");
  const gridWrap = document.getElementById("gridWrap");

  const adminBalanceView = document.getElementById("adminBalanceView");
  const balanceInput = document.getElementById("balanceInput");
  const setBalanceBtn = document.getElementById("setBalanceBtn");
  const addBalanceBtn = document.getElementById("addBalanceBtn");

  const loanForm = document.getElementById("loanForm");
  const expenseForm = document.getElementById("expenseForm");

  const exportCSVBtn = document.getElementById("exportCSV");
  const markAllForAllBtn = document.getElementById("markAllForAll");
  const unmarkAllForAllBtn = document.getElementById("unmarkAllForAll");
  const clearAllBtn = document.getElementById("clearAll");
  const markThisWeekForAllBtn = document.getElementById("markThisWeekForAll");
  const unmarkThisWeekForAllBtn = document.getElementById("unmarkThisWeekForAll");

  // data
  let members = loadData("members", []); // ensure loadData exists
  let loans = loadData("loans", []);
  let expenses = loadData("expenses", []);
  let agmBalanceObj = loadData("agmBalanceObj", { balance: 0, lastUpdated: null });

  // show current balance
  function refreshBalanceView() {
    adminBalanceView.textContent = Number(agmBalanceObj.balance || 0);
  }
  refreshBalanceView();

  // LOGIN
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const pw = document.getElementById("adminPassword").value.trim();
    if (pw === "admin123") {
      loginCard.style.display = "none";
      adminArea.style.display = "block";
      renderAll();
    } else {
      alert("Wrong password");
    }
  });

  // ADD MEMBER
  addMemberForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("mName").value.trim();
    const age = Number(document.getElementById("mAge").value) || null;
    const amount = Number(document.getElementById("mAmount").value);
    const phone = document.getElementById("mPhone").value.trim();
    if (!name || !amount || !phone) { alert("Please fill required fields"); return; }

    const member = { id: Date.now(), name, age, amount, phone, payments: {} };
    members.push(member);
    saveData("members", members);
    addMemberForm.reset();
    renderAll();
  });

  // Set Balance
  setBalanceBtn.addEventListener("click", () => {
    const amt = Number(balanceInput.value);
    if (!isNaN(amt)) {
      agmBalanceObj.balance = amt;
      agmBalanceObj.lastUpdated = new Date().toISOString();
      saveData("agmBalanceObj", agmBalanceObj);
      refreshBalanceView();
      renderAll();
      balanceInput.value = "";
    } else alert("Enter valid amount");
  });

  // Add Balance
  addBalanceBtn.addEventListener("click", () => {
    const amt = Number(balanceInput.value);
    if (!isNaN(amt)) {
      agmBalanceObj.balance = (agmBalanceObj.balance || 0) + amt;
      agmBalanceObj.lastUpdated = new Date().toISOString();
      saveData("agmBalanceObj", agmBalanceObj);
      refreshBalanceView();
      renderAll();
      balanceInput.value = "";
    } else alert("Enter valid amount");
  });

  // LOANS
  loanForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("loanName").value.trim();
    const amount = Number(document.getElementById("loanAmount").value || 0);
    const date = document.getElementById("loanDate").value || formatDate(new Date());
    if (!name || !amount) { alert("Fill loan details"); return; }
    loans.push({ id: Date.now(), name, amount, date });
    saveData("loans", loans);
    loanForm.reset();
    renderLoans();
  });

  // EXPENSES
  expenseForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("expName").value.trim();
    const amount = Number(document.getElementById("expAmount").value || 0);
    if (!name || !amount) { alert("Fill expense"); return; }
    expenses.push({ id: Date.now(), name, amount, date: formatDate(new Date()) });
    saveData("expenses", expenses);
    expenseForm.reset();
    renderExpenses();
  });

  // MARK ALL for all members
  markAllForAllBtn.addEventListener("click", () => {
    if (!confirm("Mark all weeks paid for ALL members?")) return;
    members.forEach(m => {
      sundays.forEach(s => { m.payments[formatDate(s)] = { amount: m.amount, ts: new Date().toISOString() }; });
    });
    saveData("members", members);
    renderAll();
  });

  // UNMARK ALL for all members
  unmarkAllForAllBtn.addEventListener("click", () => {
    if (!confirm("Clear all payment records for ALL members?")) return;
    members.forEach(m => m.payments = {});
    saveData("members", members);
    renderAll();
  });

  // MARK THIS WEEK for all members
  markThisWeekForAllBtn.addEventListener("click", () => {
    if (!confirm("Mark THIS week paid for ALL members?")) return;

    const today = new Date();
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - today.getDay()); // Sunday of this week without mutating 'today'

    members.forEach(m => {
      const weekKey = formatDate(currentSunday);
      m.payments[weekKey] = { amount: m.amount, ts: new Date().toISOString() };
    });

    saveData("members", members);
    renderAll();
  });

  // UNMARK THIS WEEK for all members
  unmarkThisWeekForAllBtn.addEventListener("click", () => {
    if (!confirm("Clear THIS week's payment records for ALL members?")) return;

    const today = new Date();
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - today.getDay()); // Sunday of this week without mutating 'today'

    members.forEach(m => {
      const weekKey = formatDate(currentSunday);
      delete m.payments[weekKey]; // remove only this week's payment
    });

    saveData("members", members);
    renderAll();
  });

  // EXPORT CSV
  exportCSVBtn.addEventListener("click", () => {
    if (!members.length) { alert("No members to export"); return; }
    const header = ["Name", "Phone", ...sundays.map(s => formatDate(s))];
    const rows = [header];
    members.forEach(m => {
      const row = [m.name, m.phone];
      sundays.forEach(s => {
        const p = (m.payments || {})[formatDate(s)];
        row.push(p ? `Paid:${p.amount}` : "Pending");
      });
      rows.push(row);
    });
    exportToCSV("agm-payments.csv", rows); // ensure exportToCSV exists
  });

  // CLEAR ALL data
  clearAllBtn.addEventListener("click", () => {
    if (!confirm("Delete ALL data (members, loans, expenses, balance)?")) return;
    members = []; loans = []; expenses = []; agmBalanceObj = { balance: 0, lastUpdated: null };
    saveData("members", members); saveData("loans", loans); saveData("expenses", expenses); saveData("agmBalanceObj", agmBalanceObj);
    renderAll();
    alert("All data cleared");
  });

  // render everything (members, grid, loans, expenses, balance)
  function renderAll() {
    renderMembersList();
    renderGrid();
    renderLoans();
    renderExpenses();
    refreshBalanceView();
  }

  // render loans (single definition)
  function renderLoans() {
    const box = document.getElementById("loanList");
    box.innerHTML = "";
    if (!loans.length) { box.innerHTML = "<p class='muted'>No loans</p>"; return; }
    loans.forEach(l => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.innerHTML = `
        <div>${escapeHtml(l.name)} - ₹${l.amount} <small class="muted">(${l.date})</small></div>
        <div>
          <button class="editLoan" data-id="${l.id}">Edit</button>
          <button class="delLoan" data-id="${l.id}">Delete</button>
        </div>
      `;
      box.appendChild(div);
    });

    box.querySelectorAll(".delLoan").forEach(b => b.addEventListener("click", e => {
      const id = Number(e.target.dataset.id);
      if (!confirm("Delete loan?")) return;
      loans = loans.filter(x => x.id !== id);
      saveData("loans", loans);
      renderLoans();
    }));

    box.querySelectorAll(".editLoan").forEach(b => b.addEventListener("click", e => {
      const id = Number(e.target.dataset.id);
      const loan = loans.find(x => x.id === id);
      if (!loan) return;
      const newName = prompt("Loan Name", loan.name); if(newName !== null) loan.name=newName;
      const newAmt = prompt("Amount", loan.amount); if(newAmt !== null && newAmt !== "") loan.amount=Number(newAmt);
      const newDate = prompt("Date", loan.date); if(newDate !== null) loan.date=newDate;
      saveData("loans", loans);
      renderLoans();
    }));
  }

  // render expenses (single definition)
  function renderExpenses() {
    const box = document.getElementById("expenseList");
    box.innerHTML = "";
    if (!expenses.length) { box.innerHTML = "<p class='muted'>No expenses</p>"; return; }
    expenses.forEach(ex => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.innerHTML = `
        <div>${escapeHtml(ex.name)} - ₹${ex.amount} <small class="muted">(${ex.date || ""})</small></div>
        <div>
          <button class="editExp" data-id="${ex.id}">Edit</button>
          <button class="delExp" data-id="${ex.id}">Delete</button>
        </div>
      `;
      box.appendChild(div);
    });

    box.querySelectorAll(".delExp").forEach(b => b.addEventListener("click", e => {
      const id = Number(e.target.dataset.id);
      if (!confirm("Delete expense?")) return;
      expenses = expenses.filter(x => x.id !== id);
      saveData("expenses", expenses);
      renderExpenses();
    }));

    box.querySelectorAll(".editExp").forEach(b => b.addEventListener("click", e => {
      const id = Number(e.target.dataset.id);
      const ex = expenses.find(x => x.id === id);
      if (!ex) return;
      const newName = prompt("Expense Name", ex.name); if(newName !== null) ex.name=newName;
      const newAmt = prompt("Amount", ex.amount); if(newAmt !== null && newAmt !== "") ex.amount=Number(newAmt);
      saveData("expenses", expenses);
      renderExpenses();
    }));
  }

  // render members list with per-member controls
  function renderMembersList() {
    membersList.innerHTML = "";
    if (!members.length) { membersList.innerHTML = "<p class='muted'>No members</p>"; return; }

    members.forEach((m, index) => {
      const paidWeeks = Object.keys(m.payments || {}).length;
      const totalPaid = Object.values(m.payments || {}).reduce((s, p) => s + Number(p.amount || 0), 0);
      const remainingWeeks = totalWeeks - paidWeeks;
      const remainingAmount = remainingWeeks * m.amount;

      const wrap = document.createElement("div");
      wrap.className = "member-row";
      wrap.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong>${index+1}. ${escapeHtml(m.name)}</strong><br/>
            <span class="muted">Phone: ${escapeHtml(m.phone)} — Age: ${m.age || "-"}</span>
          </div>
          <div style="text-align:right">
            <div>Paid: ₹${totalPaid}</div>
            <div>Weeks: ${paidWeeks}/${totalWeeks}</div>
          </div>
        </div>
        <div style="margin-top:8px; display:flex; gap:4px; flex-wrap:wrap;">
          <button class="markAllBtn" data-id="${m.id}">Mark All Paid</button>
          <button class="unmarkAllBtn" data-id="${m.id}">Unmark All</button>
          <button class="editBtn" data-id="${m.id}">Edit</button>
          <button class="deleteBtn" data-id="${m.id}">Delete</button>
          <button class="whatsappBtn" data-phone="${m.phone}" data-msg="Hi ${m.name}, you have paid ${paidWeeks}/${totalWeeks} weeks, total ₹${totalPaid}. Remaining: ${remainingWeeks} weeks, ₹${remainingAmount}">WhatsApp</button>
        </div>
      `;
      membersList.appendChild(wrap);
    });

    // bind per-member actions
    membersList.querySelectorAll(".markAllBtn").forEach(b => b.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      const member = members.find(x => x.id === id);
      if (!member) return;
      sundays.forEach(s => { member.payments[formatDate(s)] = { amount: member.amount, ts: new Date().toISOString() }; });
      saveData("members", members); renderAll();
    }));

    membersList.querySelectorAll(".unmarkAllBtn").forEach(b => b.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      const member = members.find(x => x.id === id);
      if (!member) return;
      member.payments = {}; saveData("members", members); renderAll();
    }));

    membersList.querySelectorAll(".deleteBtn").forEach(b => b.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      if (!confirm("Delete member and payments?")) return;
      members = members.filter(x => x.id !== id); saveData("members", members); renderAll();
    }));

    membersList.querySelectorAll(".editBtn").forEach(b => b.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      const member = members.find(x => x.id === id);
      if (!member) return;
      const newName = prompt("Name", member.name);
      if (newName !== null && newName.trim() !== "") member.name = newName.trim();
      const newAge = prompt("Age", member.age || "");
      if (newAge !== null && newAge.trim() !== "") member.age = Number(newAge);
      const newPhone = prompt("Phone", member.phone);
      if (newPhone !== null && newPhone.trim() !== "") member.phone = newPhone.trim();
      const newAmt = prompt("Weekly Amount", member.amount);
      if (newAmt !== null && newAmt.trim() !== "" && !isNaN(Number(newAmt))) member.amount = Number(newAmt);
      saveData("members", members);
      renderAll();
    }));

    // WhatsApp button
    membersList.querySelectorAll(".whatsappBtn").forEach(b => b.addEventListener("click", (e) => {
      const phone = e.target.dataset.phone.replace(/\D/g,''); // clean number
      const msg = encodeURIComponent(e.target.dataset.msg);
      const url = `https://wa.me/${phone}?text=${msg}`;
      window.open(url, "_blank");
    }));
  }


  // render grid with checkboxes for each member x sunday
  function renderGrid() {
    gridWrap.innerHTML = "";
    if (!members.length) { gridWrap.innerHTML = "<p class='muted'>Add members to see grid</p>"; return; }

    const table = document.createElement("table");
    const header = "<tr><th>Member</th>" + sundays.map(s => `<th>${formatDate(s)}</th>`).join("") + "</tr>";
    table.innerHTML = header;

    members.forEach(m => {
      let row = `<tr><td>${escapeHtml(m.name)}</td>`;
      sundays.forEach(s => {
        const key = formatDate(s);
        const paid = (m.payments || {})[key];
        row += `<td><input type="checkbox" data-id="${m.id}" data-date="${key}" ${paid ? "checked" : ""}></td>`;
      });
      row += "</tr>";
      table.innerHTML += row;
    });

    gridWrap.appendChild(table);

    // attach listeners
    table.querySelectorAll("input[type=checkbox]").forEach(cb => cb.addEventListener("change", (e) => {
      const id = Number(e.target.dataset.id);
      const date = e.target.dataset.date;
      const member = members.find(x => x.id === id);
      if (!member) return;
      if (e.target.checked) {
        member.payments[date] = { amount: member.amount, ts: new Date().toISOString() };
      } else {
        if (member.payments && member.payments[date]) delete member.payments[date];
      }
      saveData("members", members);
      renderMembersList();
    }));
  }

  // initial render (admin must login)
  // renderAll(); // only after login

});
