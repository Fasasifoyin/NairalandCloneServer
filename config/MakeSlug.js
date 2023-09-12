export const toSlug = (title) => {
  const titleToArray = title.split(" ");
  const firstFiveWords = titleToArray.slice(0, 5);
  const backToString = firstFiveWords.join(" ");

  let slug;

  // convert to lower case
  slug = backToString.toLowerCase();

  // remove special characters
  slug = slug.replace(
    /\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi,
    ""
  );
  // The /gi modifier is used to do a case insensitive search of all occurrences of a regular expression in a string

  // replace spaces with dash symbols
  slug = slug.replace(/ /gi, "-");

  // remove consecutive dash symbols
  slug = slug.replace(/\-\-\-\-\-/gi, "-");
  slug = slug.replace(/\-\-\-\-/gi, "-");
  slug = slug.replace(/\-\-\-/gi, "-");
  slug = slug.replace(/\-\-/gi, "-");

  // remove the unwanted dash symbols at the beginning and the end of the slug
  slug = "@" + slug + "@";
  slug = slug.replace(/\@\-|\-\@|\@/gi, "");
  return slug;
};
