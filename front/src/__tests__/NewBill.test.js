import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import "@testing-library/jest-dom";

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
  });
  test("When I submit a valid bill form, it should create a new bill using the store API", async () => {
    document.body.innerHTML =
      '<form data-testid="form-new-bill"><input data-testid="file" type="file" /><button data-testid="submit-button">Submit</button></form>';

    const onNavigateMock = jest.fn();
    const storeMock = {
      bills: () => ({
        create: jest.fn(() =>
          Promise.resolve({ fileUrl: "mocked-url", key: "mocked-key" })
        ),
      }),
    };

    const newBillInstance = new NewBill({
      document,
      onNavigate: onNavigateMock,
      store: storeMock,
      localStorage: window.localStorage,
    });

    const fileInput = screen.getByTestId("file");
    const imageContent = await fetch("path/to/sample/image.png").then((res) =>
      res.blob()
    );
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File([imageContent], {
            type: "image/png",
            name: "test.png",
          }),
        ],
      },
    });

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    );
    expect(storeMock.bills().create).toHaveBeenCalledWith({
      data: expect.any(FormData),
      headers: { noContentType: true },
    });

    const formData = storeMock.bills().create.mock.calls[0][0].data;
    expect(formData.get("file")).toEqual(expect.any(File));
    expect(formData.get("email")).toEqual(expect.any(String));
  });

  test("When I submit a form with no file selected, it should not create a new bill", async () => {
    document.body.innerHTML =
      '<form data-testid="form-new-bill"><input data-testid="file" type="file" /><button data-testid="submit-button">Submit</button></form>';

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
    document.body.innerHTML =
      '<form data-testid="form-new-bill"><input data-testid="file" type="file" /><button data-testid="submit-button">Submit</button></form>';

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
        files: [
          new File(["file content"], { type: "text/plain", name: "test.txt" }),
        ],
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
