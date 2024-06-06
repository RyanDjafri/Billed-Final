import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import "@testing-library/jest-dom";
import fetchMock from "jest-fetch-mock";

fetchMock.enableMocks();

describe("Given I am on the New Bill page", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    document.body.innerHTML = `
      <form data-testid="form-new-bill">
        <div>
          <label for="expense-type">Expense Type</label>
          <select id="expense-type" data-testid="expense-type">
            <option value="Transport">Transport</option>
            <option value="Food">Food</option>
            <option value="Accommodation">Accommodation</option>
          </select>
        </div>
        <div>
          <label for="expense-name">Expense Name</label>
          <input type="text" id="expense-name" data-testid="expense-name" />
        </div>
        <div>
          <label for="amount">Amount</label>
          <input type="number" id="amount" data-testid="amount" />
        </div>
        <div>
          <label for="datepicker">Date</label>
          <input type="date" id="datepicker" data-testid="datepicker" />
        </div>
        <div>
          <label for="vat">VAT</label>
          <input type="number" id="vat" data-testid="vat" />
        </div>
        <div>
          <label for="pct">Percentage</label>
          <input type="number" id="pct" data-testid="pct" />
        </div>
        <div>
          <label for="commentary">Commentary</label>
          <textarea id="commentary" data-testid="commentary"></textarea>
        </div>
        <div>
          <label for="file">File</label>
          <input type="file" id="file" data-testid="file" />
        </div>
        <button type="submit" data-testid="submit-button">Submit</button>
      </form>
    `;
  });

  test("When I submit a valid bill form, it should create a new bill using the store API", async () => {
    const onNavigateMock = jest.fn();
    const createMock = jest.fn(() =>
      Promise.resolve({ fileUrl: "mocked-url", key: "mocked-key" })
    );
    const storeMock = {
      bills: () => ({
        create: createMock,
      }),
    };

    const newBillInstance = new NewBill({
      document,
      onNavigate: onNavigateMock,
      store: storeMock,
      localStorage: window.localStorage,
    });

    const fileInput = screen.getByTestId("file");
    const imageContent = new Blob(["image content"], { type: "image/png" });

    fireEvent.change(fileInput, {
      target: {
        files: [new File([imageContent], "test.png", { type: "image/png" })],
      },
    });

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH.Bills);
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.any(FormData),
      headers: { noContentType: true },
    });

    const formData = createMock.mock.calls[0][0].data;
    expect(formData.get("file")).toEqual(expect.any(File));
    expect(formData.get("email")).toEqual("a@a");
  });

  test("When I submit a form with no file selected, it should not create a new bill", async () => {
    const onNavigateMock = jest.fn();
    const storeMock = {
      bills: () => ({
        create: jest.fn(),
      }),
    };

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(onNavigateMock).not.toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    );
    expect(storeMock.bills().create).not.toHaveBeenCalled();
  });

  test("When I submit a form with an invalid file type, it should not create a new bill", async () => {
    const onNavigateMock = jest.fn();
    const storeMock = {
      bills: () => ({
        create: jest.fn(),
      }),
    };

    const newBillInstance = new NewBill({
      document,
      onNavigate: onNavigateMock,
      store: storeMock,
      localStorage: window.localStorage,
    });

    const fileInput = screen.getByTestId("file");
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["file content"], "test.txt", { type: "text/plain" })],
      },
    });

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(onNavigateMock).not.toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    );
    expect(storeMock.bills().create).not.toHaveBeenCalled();
  });
});
