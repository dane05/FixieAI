import Fuse from "fuse.js";
import { useMemo } from "react";

const useFuseSearch = (data, keys = ["text"]) => {
  const fuse = useMemo(() => new Fuse(data, {
    includeScore: true,
    threshold: 0.4,
    keys
  }), [data]);

  return (query) => fuse.search(query).map(result => result.item);
};

export default useFuseSearch;
