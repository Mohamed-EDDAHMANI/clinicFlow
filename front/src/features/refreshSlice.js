import { createSlice } from "@reduxjs/toolkit";

const refreshSlice = createSlice({
    name: "refresh",
    initialState: { version: 0 },
    reducers: {
        dataChanged: (state) => {
            state.version += 1;
        }
    }
});

export const { dataChanged } = refreshSlice.actions;
export default refreshSlice.reducer;
