import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    this.fileValidationPassed = true;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = (e) => {
    e.preventDefault();
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const file = fileInput.files[0];

    if (!file) {
      console.error("No file selected");
      return;
    }

    const fileName = file.name;
    this.fileName = fileName;

    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!allowedFileTypes.includes(file.type)) {
      console.error(
        "Invalid file type. Please select a JPG, JPEG, PNG, or PDF file."
      );
      this.fileValidationPassed = false;
      return;
    }

    formData.append("file", file);
    formData.append("email", email);

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true,
        },
      })
      .then(({ fileName, key }) => {
        this.fileUrl = fileName;
        this.billId = key;
        console.log("File uploaded successfully:", fileName);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  };

  handleSubmit = (e) => {
    e.preventDefault();

    if (!this.fileValidationPassed) {
      console.error("File validation failed. Cannot submit the form.");
      return;
    } else {
      const email = JSON.parse(localStorage.getItem("user")).email;
      const bill = {
        email,
        type: e.target.querySelector(`select[data-testid="expense-type"]`)
          .value,
        name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
        amount: parseInt(
          e.target.querySelector(`input[data-testid="amount"]`).value
        ),
        date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
        vat: e.target.querySelector(`input[data-testid="vat"]`).value,
        pct:
          parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
          20,
        commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
          .value,
        fileUrl: this.fileUrl,
        fileName: this.fileName,
        status: "pending",
      };
      this.updateBill(bill);
      this.onNavigate(ROUTES_PATH["Bills"]);
    }
  };

  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error("Error updating bill:", error));
    }
  };
}
