import { updateState } from "../lib/fileStore.js";

function nextTicketId(tickets) {
  const highest = tickets.reduce((max, ticket) => {
    const match = String(ticket.id).match(/TKT-(\d+)/);
    const value = match ? Number(match[1]) : 0;
    return Math.max(max, value);
  }, 1000);

  return `TKT-${String(highest + 1).padStart(4, "0")}`;
}

export async function listTickets() {
  return updateState(async (state) => state);
}

export async function createTicket({ userId, title, description, domain }) {
  return updateState(async (state) => {
    const ticket = {
      id: nextTicketId(state.tickets),
      userId,
      title,
      description,
      domain,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      ...state,
      tickets: [ticket, ...state.tickets],
    };
  });
}

export async function updateTicketStatus(ticketId, status) {
  return updateState(async (state) => ({
    ...state,
    tickets: state.tickets.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, status, updatedAt: new Date().toISOString() } : ticket,
    ),
  }));
}
