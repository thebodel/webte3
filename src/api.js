import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.DEV ? "" : "https://wt1zadanie.iolab.sk",
});

const path = (name, suffix = "") => `/api/${name}${suffix}`;
const message = (error) =>
  error.response?.data?.detail?.[0]?.msg ||
  error.response?.data?.detail ||
  error.message ||
  "Operácia zlyhala";

async function request(call) {
  try {
    return (await call()).data;
  } catch (error) {
    throw new Error(message(error));
  }
}

export const todosApi = {
  list: (name) => request(() => client.get(path(name))).then((data) => data.todos ?? []),
  create: (name, todo) => request(() => client.post(path(name), todo)),
  update: (name, id, todo) => request(() => client.put(path(name, `/${id}`), todo)),
  remove: (name, id) => request(() => client.delete(path(name, `/${id}`))),
  done: (name, id) => request(() => client.patch(path(name, `/${id}/done`))),
  undone: (name, id) => request(() => client.patch(path(name, `/${id}/undone`))),
  reset: (name) => request(() => client.post(path(name, "/reset"))).then((data) => data.todos ?? []),
};
