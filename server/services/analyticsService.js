import { readState } from "../lib/fileStore.js";

export async function buildAnalytics() {
  const state = await readState();
  const ticketCounts = state.tickets.reduce(
    (counts, ticket) => {
      counts[ticket.status] += 1;
      return counts;
    },
    { open: 0, in_progress: 0, resolved: 0 },
  );

  return {
    users: state.users.length,
    tickets: state.tickets.length,
    conversations: state.conversations.length,
    feedbackCount: state.feedback.length,
    ticketCounts,
    recentTickets: state.tickets.slice(0, 5),
  };
}
