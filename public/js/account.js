const updateUsernameBtn = document.getElementById("update-username");
const cancelUsernameBtn = document.getElementById("cancel-username");
updateUsernameBtn.addEventListener("click", () => {
  updateUsernameBtn.parentElement.classList.add("opacity-0");
  cancelUsernameBtn.parentElement.classList.remove("opacity-0");
});
cancelUsernameBtn.addEventListener("click", () => {
  cancelUsernameBtn.parentElement.classList.add("opacity-0");
  updateUsernameBtn.parentElement.classList.remove("opacity-0");
});

const changePasswordBtn = document.getElementById("change-password");
const cancelPasswordBtn = document.getElementById("cancel-password");
changePasswordBtn.addEventListener("click", () => {
  changePasswordBtn.parentElement.parentElement.classList.add("opacity-0");
  cancelPasswordBtn.parentElement.parentElement.classList.remove("opacity-0");
});
cancelPasswordBtn.addEventListener("click", () => {
  cancelPasswordBtn.parentElement.parentElement.classList.add("opacity-0");
  changePasswordBtn.parentElement.parentElement.classList.remove("opacity-0");
});
