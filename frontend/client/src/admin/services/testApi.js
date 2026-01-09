import api from "../../services/api.js";

/* ===============================
   CREATE TEST
=============================== */
export const createTest = (data) =>
  api.post("/tests", data);

/* ===============================
   GET ADMIN TESTS (LIVE + EXPIRED)
=============================== */
export const getMyTests = () =>
  api.get("/tests/my-tests");

/* ===============================
   GET SINGLE TEST (DETAILS)
=============================== */
export const getTestById = (id) =>
  api.get(`/tests/${id}`);
