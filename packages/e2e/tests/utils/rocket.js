module.exports.rocketFetch = async (path) => {
  const res = await fetch(`http://localhost:8000/${path}`);
  const data = await res.json();
  return data;
};
