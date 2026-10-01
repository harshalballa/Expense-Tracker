/* =========================================
   EXPENSE TRACKER
   ========================================= */


/* ---------- DEFAULT DATA ---------- */

let transactions = JSON.parse(
    localStorage.getItem("transactions")
) || [];

let accounts = JSON.parse(
    localStorage.getItem("accounts")
) || [
    {
        id: 1,
        name: "Cash",
        type: "Cash"
    },
    {
        id: 2,
        name: "Bank Account",
        type: "Bank"
    },
    {
        id: 3,
        name: "UPI",
        type: "Digital"
    }
];

let budget = Number(
    localStorage.getItem("budget")
) || 0;


/* ---------- SAVE DATA ---------- */

function saveData() {

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        "accounts",
        JSON.stringify(accounts)
    );

    localStorage.setItem(
        "budget",
        budget
    );
}


/* ---------- INITIALIZATION ---------- */

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];

    updateAccountDropdown();
    updateCategoryDropdown();

    updateDashboard();
    renderTransactions();
    renderAccounts();
    updateBudgetUI();
    createCharts();

});


/* ---------- NAVIGATION ---------- */

function showSection(sectionName) {

    document.querySelectorAll(".section")
        .forEach(section => {
            section.classList.remove("active-section");
        });

    document.getElementById(sectionName)
        .classList.add("active-section");


    document.querySelectorAll(".nav-item")
        .forEach(button => {
            button.classList.remove("active");
        });


    const titles = {
        dashboard: "Dashboard",
        transactions: "Transactions",
        budget: "Budget",
        accounts: "Accounts",
        reports: "Reports"
    };

    document.getElementById("pageTitle").textContent =
        titles[sectionName];

    if (sectionName === "dashboard") {
        updateDashboard();
        createCharts();
    }

    if (sectionName === "reports") {
        createMonthlyChart();
    }
}


/* ---------- TRANSACTION MODAL ---------- */

function openTransactionModal(id = null) {

    const modal =
        document.getElementById("transactionModal");

    const form =
        document.getElementById("transactionForm");

    form.reset();

    document.getElementById("transactionId").value = "";

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];

    document.getElementById("modalTitle").textContent =
        "Add Transaction";

    updateAccountDropdown();


    if (id !== null) {

        const transaction =
            transactions.find(t => t.id === id);

        if (!transaction) return;

        document.getElementById("modalTitle").textContent =
            "Edit Transaction";

        document.getElementById("transactionId").value =
            transaction.id;

        document.getElementById("transactionType").value =
            transaction.type;

        document.getElementById("description").value =
            transaction.description;

        document.getElementById("amount").value =
            transaction.amount;

        document.getElementById("date").value =
            transaction.date;

        document.getElementById("category").value =
            transaction.category;

        document.getElementById("account").value =
            transaction.account;

        document.getElementById("recurring").checked =
            transaction.recurring || false;
    }


    modal.classList.add("show");
}


function closeTransactionModal() {

    document.getElementById("transactionModal")
        .classList.remove("show");
}


/* ---------- ADD / EDIT TRANSACTION ---------- */

document.getElementById("transactionForm")
    .addEventListener("submit", function (e) {

        e.preventDefault();

        const id =
            document.getElementById("transactionId").value;

        const transaction = {

            id: id
                ? Number(id)
                : Date.now(),

            type:
                document.getElementById("transactionType").value,

            description:
                document.getElementById("description").value.trim(),

            amount:
                Number(document.getElementById("amount").value),

            date:
                document.getElementById("date").value,

            category:
                document.getElementById("category").value,

            account:
                document.getElementById("account").value,

            recurring:
                document.getElementById("recurring").checked
        };


        if (!transaction.description) {
            alert("Please enter a description.");
            return;
        }

        if (transaction.amount <= 0) {
            alert("Amount must be greater than zero.");
            return;
        }


        if (id) {

            const index =
                transactions.findIndex(
                    t => t.id === Number(id)
                );

            transactions[index] = transaction;

        } else {

            transactions.push(transaction);
        }


        saveData();

        closeTransactionModal();

        updateDashboard();
        renderTransactions();
        updateBudgetUI();
        createCharts();

    });


/* ---------- DELETE TRANSACTION ---------- */

function deleteTransaction(id) {

    const confirmed =
        confirm("Delete this transaction?");

    if (!confirmed) return;

    transactions =
        transactions.filter(
            transaction => transaction.id !== id
        );

    saveData();

    updateDashboard();
    renderTransactions();
    updateBudgetUI();
    createCharts();
}


/* ---------- DASHBOARD ---------- */

function updateDashboard() {

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expense += transaction.amount;
        }

    });


    const balance = income - expense;

    const savingRate =
        income > 0
            ? ((balance / income) * 100)
            : 0;


    document.getElementById("totalIncome")
        .textContent = formatCurrency(income);

    document.getElementById("totalExpense")
        .textContent = formatCurrency(expense);

    document.getElementById("balance")
        .textContent = formatCurrency(balance);

    document.getElementById("savingRate")
        .textContent =
        `${Math.max(0, savingRate).toFixed(1)}%`;


    renderRecentTransactions();
}


/* ---------- RECENT TRANSACTIONS ---------- */

function renderRecentTransactions() {

    const container =
        document.getElementById("recentTransactions");

    const recent =
        [...transactions]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML =
            `<div class="empty">
                No transactions yet.
             </div>`;

        return;
    }


    container.innerHTML = recent.map(transaction => {

        const sign =
            transaction.type === "income"
                ? "+"
                : "-";

        const className =
            transaction.type === "income"
                ? "income-text"
                : "expense-text";


        return `
            <div class="transaction-row">

                <div>
                    <strong>${escapeHTML(transaction.description)}</strong>
                    <small>
                        ${transaction.date} •
                        ${escapeHTML(transaction.category)}
                    </small>
                </div>

                <strong class="${className}">
                    ${sign}${formatCurrency(transaction.amount)}
                </strong>

            </div>
        `;

    }).join("");
}


/* ---------- TRANSACTION TABLE ---------- */

function renderTransactions() {

    const table =
        document.getElementById("transactionTable");

    const search =
        document.getElementById("searchInput")
            ?.value
            .toLowerCase() || "";

    const type =
        document.getElementById("typeFilter")
            ?.value || "all";

    const category =
        document.getElementById("categoryFilter")
            ?.value || "all";


    let filtered =
        transactions.filter(transaction => {

            const matchesSearch =
                transaction.description
                    .toLowerCase()
                    .includes(search);

            const matchesType =
                type === "all" ||
                transaction.type === type;

            const matchesCategory =
                category === "all" ||
                transaction.category === category;

            return (
                matchesSearch &&
                matchesType &&
                matchesCategory
            );
        });


    filtered.sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );


    if (filtered.length === 0) {

        table.innerHTML =
            `<tr>
                <td colspan="7" class="empty">
                    No transactions found.
                </td>
             </tr>`;

        return;
    }


    table.innerHTML = filtered.map(transaction => {

        const isIncome =
            transaction.type === "income";

        const sign =
            isIncome ? "+" : "-";

        const className =
            isIncome
                ? "income-text"
                : "expense-text";


        return `
            <tr>

                <td>${transaction.date}</td>

                <td>
                    <strong>
                        ${escapeHTML(transaction.description)}
                    </strong>

                    ${transaction.recurring
                        ? "<br><small>🔁 Recurring</small>"
                        : ""}
                </td>

                <td>
                    <span class="category-tag">
                        ${escapeHTML(transaction.category)}
                    </span>
                </td>

                <td>
                    ${escapeHTML(transaction.account)}
                </td>

                <td>
                    ${transaction.type}
                </td>

                <td class="${className}">
                    ${sign}${formatCurrency(transaction.amount)}
                </td>

                <td>

                    <button
                        class="action-btn"
                        onclick="openTransactionModal(${transaction.id})"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        class="action-btn"
                        onclick="deleteTransaction(${transaction.id})"
                        title="Delete"
                    >
                        🗑️
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


/* ---------- CATEGORY DROPDOWN ---------- */

function updateCategoryDropdown() {

    const select =
        document.getElementById("categoryFilter");

    const categories =
        [...new Set(
            transactions.map(
                transaction => transaction.category
            )
        )];


    select.innerHTML =
        `<option value="all">
            All Categories
        </option>`;


    categories.forEach(category => {

        select.innerHTML +=
            `<option value="${escapeHTML(category)}">
                ${escapeHTML(category)}
             </option>`;
    });
}


/* ---------- ACCOUNTS ---------- */

function updateAccountDropdown() {

    const select =
        document.getElementById("account");

    select.innerHTML = "";

    accounts.forEach(account => {

        select.innerHTML +=
            `<option value="${escapeHTML(account.name)}">
                ${escapeHTML(account.name)}
             </option>`;
    });
}


function renderAccounts() {

    const container =
        document.getElementById("accountsList");

    container.innerHTML =
        accounts.map(account => {

            let balance = 0;

            transactions.forEach(transaction => {

                if (
                    transaction.account === account.name
                ) {

                    if (transaction.type === "income") {
                        balance += transaction.amount;
                    } else {
                        balance -= transaction.amount;
                    }
                }
            });


            return `
                <div class="account-card">

                    <h4>
                        ${escapeHTML(account.name)}
                    </h4>

                    <p>
                        ${escapeHTML(account.type)}
                    </p>

                    <div class="account-balance">
                        ${formatCurrency(balance)}
                    </div>

                </div>
            `;

        }).join("");
}


function addAccount() {

    const name =
        prompt("Enter account name:");

    if (!name || !name.trim()) return;


    const type =
        prompt(
            "Enter account type:",
            "Bank"
        ) || "Other";


    accounts.push({

        id: Date.now(),

        name: name.trim(),

        type: type.trim()

    });


    saveData();

    updateAccountDropdown();

    renderAccounts();
}


/* ---------- BUDGET ---------- */

function saveBudget() {

    const value =
        Number(
            document.getElementById("budgetInput").value
        );


    if (value < 0) {

        alert("Budget cannot be negative.");

        return;
    }


    budget = value;

    saveData();

    updateBudgetUI();

    alert("Budget saved successfully.");
}


function updateBudgetUI() {

    document.getElementById("budgetAmount")
        .textContent =
        formatCurrency(budget);


    document.getElementById("budgetStatus")
        .textContent =
        formatCurrency(budget);


    const expense =
        transactions
            .filter(t => t.type === "expense")
            .reduce(
                (sum, t) => sum + t.amount,
                0
            );


    const remaining =
        budget - expense;


    const percentage =
        budget > 0
            ? Math.min((expense / budget) * 100, 100)
            : 0;


    document.getElementById("budgetProgress")
        .style.width =
        percentage + "%";


    document.getElementById("budgetProgress2")
        .style.width =
        percentage + "%";


    document.getElementById("budgetSpent")
        .textContent =
        `Spent: ${formatCurrency(expense)}`;


    document.getElementById("budgetSpent2")
        .textContent =
        `Spent: ${formatCurrency(expense)}`;


    document.getElementById("budgetRemaining")
        .textContent =
        `Remaining: ${formatCurrency(remaining)}`;


    document.getElementById("budgetRemaining2")
        .textContent =
        `Remaining: ${formatCurrency(remaining)}`;


    document.getElementById("budgetInput")
        .value =
        budget || "";
}


/* ---------- CATEGORY CHART ---------- */

let categoryChart = null;
let monthlyChart = null;


function createCharts() {

    const canvas =
        document.getElementById("categoryChart");

    if (!canvas) return;


    const categories = {};


    transactions
        .filter(t => t.type === "expense")
        .forEach(transaction => {

            if (!categories[transaction.category]) {
                categories[transaction.category] = 0;
            }

            categories[transaction.category] +=
                transaction.amount;
        });


    const labels =
        Object.keys(categories);

    const data =
        Object.values(categories);


    if (categoryChart) {
        categoryChart.destroy();
    }


    categoryChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [{
                    data: data
                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                }

            }

        });
}


/* ---------- MONTHLY CHART ---------- */

function createMonthlyChart() {

    const canvas =
        document.getElementById("monthlyChart");

    if (!canvas) return;


    const monthly = {};


    transactions.forEach(transaction => {

        const month =
            transaction.date.substring(0, 7);


        if (!monthly[month]) {

            monthly[month] = {
                income: 0,
                expense: 0
            };
        }


        if (transaction.type === "income") {

            monthly[month].income +=
                transaction.amount;

        } else {

            monthly[month].expense +=
                transaction.amount;
        }

    });


    const months =
        Object.keys(monthly).sort();


    const income =
        months.map(
            month => monthly[month].income
        );

    const expense =
        months.map(
            month => monthly[month].expense
        );


    if (monthlyChart) {
        monthlyChart.destroy();
    }


    monthlyChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: months,

                datasets: [

                    {
                        label: "Income",
                        data: income
                    },

                    {
                        label: "Expenses",
                        data: expense
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                }

            }

        });
}


/* ---------- CSV EXPORT ---------- */

function exportCSV() {

    if (transactions.length === 0) {

        alert("No transactions to export.");

        return;
    }


    let csv =
        "Date,Description,Category,Account,Type,Amount,Recurring\n";


    transactions.forEach(transaction => {

        csv +=
            `"${transaction.date}",` +
            `"${transaction.description}",` +
            `"${transaction.category}",` +
            `"${transaction.account}",` +
            `"${transaction.type}",` +
            `"${transaction.amount}",` +
            `"${transaction.recurring ? "Yes" : "No"}"\n`;

    });


    const blob =
        new Blob(
            [csv],
            { type: "text/csv;charset=utf-8;" }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "expense-transactions.csv";

    link.click();


    URL.revokeObjectURL(url);
}


/* ---------- THEME ---------- */

function toggleTheme() {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "darkMode",
        dark
    );
}


if (
    localStorage.getItem("darkMode") === "true"
) {
    document.body.classList.add("dark");
}


/* ---------- RESET ---------- */

function resetData() {

    const confirmed =
        confirm(
            "This will delete all transactions, accounts and budget. Continue?"
        );


    if (!confirmed) return;


    localStorage.clear();

    location.reload();
}


/* ---------- HELPERS ---------- */

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(value);
}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ---------- MODAL CLICK OUTSIDE ---------- */

window.addEventListener("click", function(event) {

    const modal =
        document.getElementById("transactionModal");

    if (event.target === modal) {
        closeTransactionModal();
    }

});