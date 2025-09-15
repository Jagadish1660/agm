// main.js
document.addEventListener("DOMContentLoaded", () => {
  const START = new Date("2025-09-07");
  const END = new Date("2026-08-16");
  const sundays = getSundaysBetween(START, END);
  const totalWeeks = sundays.length;

  const members = loadData("members", []);
  const loans = loadData("loans", []);
  const expenses = loadData("expenses", []);
  const agmBalanceObj = loadData("agmBalanceObj", { balance: 0, lastUpdated: null });

  // timeline
  const today = new Date();
  const currentWeekNumber = Math.max(1, sundays.filter(d => d <= today).length);

  document.getElementById("timelineBox").innerHTML = `
    <h2>Bisi Timeline</h2>
    <p><strong>Start:</strong> ${formatDate(START)}</p>
    <p><strong>End:</strong> ${formatDate(END)}</p>
    <p><strong>Total Weeks:</strong> ${totalWeeks}</p>
    <p><strong>Current Week:</strong> ${currentWeekNumber} / ${totalWeeks}</p>
  `;

  // members list with numbering
const membersBox = document.getElementById("membersListPublic");
membersBox.innerHTML = "";
if (!members.length) {
  membersBox.innerHTML = "<p class='muted'>No members yet</p>";
}
members.forEach((m, index) => { // index starts from 0
  const paidWeeks = Object.keys(m.payments || {}).length;
  const totalPaid = Object.values(m.payments || {}).reduce((s, p) => s + Number(p.amount || 0), 0);
  const remaining = totalWeeks - paidWeeks;
  const div = document.createElement("div");
  div.className = "member-row card";
  div.innerHTML = `
    ${index + 1}. <strong>${escapeHtml(m.name)}</strong> (${escapeHtml(m.phone)})<br/>
    Weekly: ₹${m.amount} | Paid Weeks: ${paidWeeks}/${totalWeeks} | Total Paid: ₹${totalPaid} | Remaining: ${remaining} weeks
  `;
  membersBox.appendChild(div);
});

  // weekly collection for current (next or current) Sunday
  const thisSunday = getNextOrCurrentSunday(today);
  const weekKey = formatDate(thisSunday);
  let weekCount = 0, weekCollected = 0;
  members.forEach(m => {
    if (m.payments && m.payments[weekKey]) { weekCount++; weekCollected += Number(m.payments[weekKey].amount || 0); }
  });
  document.getElementById("weeklyCollection").innerHTML = `
    <p><strong>Week date:</strong> ${formatDate(thisSunday)}</p>
    <p><strong>Members Paid:</strong> ${weekCount}</p>
    <p><strong>Collected This Week:</strong> ₹${weekCollected}</p>
  `;

  // agm balance
  document.getElementById("agmBalance").textContent = "₹" + (Number(agmBalanceObj.balance) || 0);
  document.getElementById("agmBalanceDetail").textContent = "₹" + (Number(agmBalanceObj.balance) || 0) + (agmBalanceObj.lastUpdated ? " (updated: " + agmBalanceObj.lastUpdated + ")" : "");

  // loans
  const loanBox = document.getElementById("loanList");
  loanBox.innerHTML = "";
  if (!loans.length) loanBox.innerHTML = "<p class='muted'>No loans recorded</p>";
  else loans.forEach(l => loanBox.innerHTML += `<div>${escapeHtml(l.name)} - ₹${l.amount} <small class="muted">(${l.date})</small></div>`);

  // expenses
  const expenseBox = document.getElementById("expenseList");
  expenseBox.innerHTML = "";
  if (!expenses.length) expenseBox.innerHTML = "<p class='muted'>No expenses recorded</p>";
  else expenses.forEach(e => expenseBox.innerHTML += `<div>${escapeHtml(e.name)} - ₹${e.amount} <small class="muted">(${e.date||''})</small></div>`);
});




// ...existing code...

/**
 * Render weekly summary and list into #weeklyCollection
 * weeklyData: array of { week: number, amount: number }
 * totalWeeks: total weeks planned (default 52)
 */
function renderWeeklySummary(weeklyData, totalWeeks = 52) {
  const weeksDone = Array.isArray(weeklyData) ? weeklyData.length : 0;
  const remaining = Math.max(0, totalWeeks - weeksDone);
  const totalCollected = (weeklyData || []).reduce((s, w) => s + (Number(w.amount) || 0), 0);

  const weeksDoneEl = document.getElementById('weeksDone');
  const totalWeeksEl = document.getElementById('totalWeeks');
  const weeksRemainingEl = document.getElementById('weeksRemaining');
  const totalCollectedEl = document.getElementById('totalCollected');
  const listEl = document.getElementById('weeklyCollectionList');

  if (weeksDoneEl) weeksDoneEl.textContent = String(weeksDone);
  if (totalWeeksEl) totalWeeksEl.textContent = String(totalWeeks);
  if (weeksRemainingEl) weeksRemainingEl.textContent = String(remaining);
  if (totalCollectedEl) totalCollectedEl.textContent = formatCurrency(totalCollected);

  if (!listEl) return;
  if (!weeklyData || weeklyData.length === 0) {
    listEl.innerHTML = '<p>No weekly records yet.</p>';
    return;
  }

  listEl.innerHTML = weeklyData
    .map(w => {
      const amt = formatCurrency(Number(w.amount) || 0);
      return `<div class="week-row">Week ${w.week}: <strong>${amt}</strong></div>`;
    })
    .join('');
}
