const AddMinutesToDate = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

export default AddMinutesToDate;