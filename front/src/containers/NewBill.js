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
    formNewBill.addEventListener("submit", this.handleSubmit.bind(this));
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile.bind(this));
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = async (e) => {
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
    const email = JSON.parse(JSON.parse(localStorage.getItem("user"))).email;
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!allowedFileTypes.includes(file.type)) {
      console.error(
        "Invalid file type. Please select a JPG, JPEG, or PNG file."
      );
      this.fileValidationPassed = false;
      return;
    }

    formData.append("file", file);
    formData.append("email", email);

    try {
      const { fileUrl, key } = await this.store.bills().create({
        data: formData,
        headers: {
          noContentType: true,
        },
      });
      this.fileUrl = fileUrl;
      this.billId = key;
      console.log("File uploaded successfully:", fileUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    if (!this.fileValidationPassed) {
      console.error("File validation failed. Cannot submit the form.");
      return;
    }

    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
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

    try {
      await this.store.bills().create({
        data: JSON.stringify(bill),
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.onNavigate(ROUTES_PATH["Bills"]);
    } catch (error) {
      console.error("Error creating bill:", error);
    }
  };
}
