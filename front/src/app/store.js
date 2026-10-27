import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/es/storage";
import authReducer from "../features/authSlice";
import cartReducer from "../features/cartSlice";
import productReducer from "../features/productSlice";

// Only the user is saved in localStorage. The access token stays in memory (XSS)
// and comes back from /auth/refresh on the first 401.
const authPersistConfig = { key: "auth", storage, whitelist: ["user"] };

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
    cart: cartReducer,
    product: productReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
    }),
});

export const persistor = persistStore(store);
