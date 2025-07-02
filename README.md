# Jira Toolbox & Metrics

Jira Toolbox & Metrics is a locally-run, browser-based dashboard designed to provide Engineering Managers and teams with powerful insights into their sprint data. It helps with forecasting future capacity, analyzing historical performance, and monitoring the health of an active sprint, all without needing a dedicated backend server. All data is stored securely in your browser's local storage.

Made with ❤️ by Adrián Díaz in Barcelona.

## Features

This tool is organized into three main views:

### 1. 🚀 Forecaster

This tab is focused on planning and predicting future sprints.

* **Import Historical Sprints:** Automatically fetch a list of completed sprints from your Jira board and import their detailed data (tickets, story points, assignees, etc.).
* **Capacity Forecasting:** Based on the historical data, the tool calculates your team's velocity and provides a data-driven forecast for upcoming sprints.
* **Advanced Planning:** Switch to "Advanced Mode" for a more granular forecast based on individual team member velocities and specific days off.
* **Risk Analysis:** Get an at-a-glance risk assessment for your next sprint based on planned time off, historical carry-over, and the absence of key team members.

### 2. 📊 Team Stats

Analyze your team's performance across all imported sprints.

* **Performance Charts:** Visualize total story points and tickets completed by each team member.
* **Individual Breakdowns:** See detailed statistics for each person, including a breakdown of the types of tickets they've completed.
* **Powerful Filters:** Filter the entire view by date range or specific sprints to drill down into performance over different periods.

### 3. ❤️‍🩹 Current Sprint

Get a real-time dashboard for the sprint that is currently in progress.

* **Live Metrics:** See total committed story points and the number of tickets in progress vs. done.
* **Sprint Burndown Chart:** Track the team's progress against an ideal burndown line, with colored regions indicating if the team is ahead of or behind schedule.
* **Sprint Health & Red Flags:** Automatically identify potential issues that require attention, such as:
    * **Scope Creep:** Tickets added after the sprint started.
    * **Stale Tickets:** Tickets that have been "In Progress" for too long.
    * **Unassigned Tickets:** Work that is in progress but has no owner.
    * **Flagged Issues:** Any tickets that have been manually flagged in Jira.
* **Member Highlights:** Celebrate individual contributions with fun awards for "The Point Master," "The Ticket Titan," and "The Bug Squasher."

## 🚀 How to Run Locally

This project was built with [Vite](https://vitejs.dev/) and uses `npm` as its package manager.

### Prerequisites

* [Node.js](https://nodejs.org/) (version 18.x or higher is recommended)
* A browser extension to handle CORS issues (e.g., [CORS Unblock](https://chromewebstore.google.com/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino?hl=en) for Chrome). This is necessary for the app to make direct requests to the Jira API from your browser.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/adriandiazgar/team-capacity-forecaster.git](https://github.com/adriandiazgar/team-capacity-forecaster.git)
    cd team-capacity-forecaster
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the application, and you can access it at `http://localhost:5173` (or another port if 5173 is in use).

4.  **First-Time Use:**
    * The first time you use the app, you will need to enter your **Jira Domain**, **Board ID**, and **Story Point Field ID** in the appropriate sections to fetch data.
    * This information will be saved in your browser's local storage for future sessions.

## 🤝 How to Contribute

Contributions are welcome! If you have an idea for a new feature or have found a bug, please follow these general guidelines.

### Reporting Bugs

* Before creating a bug report, please check the existing issues to see if your problem has already been reported.
* When creating a bug report, please include as many details as possible: a clear description, steps to reproduce, and screenshots if applicable.

### Suggesting Enhancements

* We are always looking for ideas to make this tool better. Feel free to open an issue with the "enhancement" label to suggest a new feature or an improvement to an existing one.

### Pull Requests

1.  Fork the repository and create your branch from `main`.
2.  Make your changes, ensuring you follow the existing code style.
3.  Write clear, concise commit messages.
4.  Once your changes are ready, open a pull request and provide a detailed description of the changes you've made.

Thank you for helping make this tool better!