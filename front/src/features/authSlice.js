import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "auth",
    initialState: { user: null, accessToken: null },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
        },
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
        }
    }
});

export const { setUser, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
