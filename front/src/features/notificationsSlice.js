import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
    name: "notifications",
    initialState: { items: [] },
    reducers: {
        notify: {
            reducer: (state, action) => {
                state.items.push(action.payload);
            },
            prepare: ({ type, message }) => ({
                payload: { id: crypto.randomUUID(), type, message },
            }),
        },
        dismiss: (state, action) => {
            state.items = state.items.filter((item) => item.id !== action.payload);
        },
    },
});

export const { notify, dismiss } = notificationsSlice.actions;
export default notificationsSlice.reducer;
