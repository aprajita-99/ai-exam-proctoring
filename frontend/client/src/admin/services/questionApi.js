import api from "../../services/api.js";

export const getQuestions = () =>
  api.get("/questions");

export const createQuestion = (data) =>
  api.post("/questions", data);

export const updateQuestion = (id, data) =>
  api.put(`/questions/${id}`, data);

export const deleteQuestion = (id) =>
  api.delete(`/questions/${id}`);
