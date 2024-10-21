export const toSlug = (title) => {
  const firstFiveWords = title.split(" ").slice(0, 5).join(" ");

  // Convert to lowercase and remove special characters
  let slug = firstFiveWords
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove special characters (except space and dash)
    .trim() // trim spaces at the ends
    .replace(/\s+/g, "-") // replace spaces with dashes
    .replace(/-+/g, "-"); // replace multiple dashes with a single dash

  return slug;
};
