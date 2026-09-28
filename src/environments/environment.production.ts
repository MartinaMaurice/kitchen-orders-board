// Deployed builds point at my-json-server, which serves db.json straight from the
// GitHub repo as a REST API (no server to host). Update the path after pushing to GitHub:
// https://my-json-server.typicode.com/<github-user>/<repo-name>
export const environment = {
  production: true,
  apiUrl: 'https://my-json-server.typicode.com/martinamaurice/kitchen-orders-board',
};
