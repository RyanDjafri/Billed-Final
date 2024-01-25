/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import { formatDate } from "../app/format.js";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import storeMock from "../__mocks__/store.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

jest.mock("jquery", () => ({
  fn: {
    html: jest.fn(),
  },
}));

describe("Given I am connected as an employee", () => {
  describe("When I am on the Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
    });

    test("fetches bills from the mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Validations"));
      const content = await screen.getByText("Mes notes de frais");
      expect(content).toBeTruthy();
      bills.forEach((bill) => {
        const billName = screen.getByText(bill.name);
        const billAmount = screen.getByText(`${bill.amount} €`);
        const billDate = screen.getByText(bill.date);
        const billStatus = screen.getByText(bill.status);

        expect(billName).toBeInTheDocument();
        expect(billAmount).toBeInTheDocument();
        expect(billDate).toBeInTheDocument();
        expect(billStatus).toBeInTheDocument();
      });
    });

    test("Then the bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      window.onNavigate(ROUTES_PATH.Bills);
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", async () => {
      document.body.innerHTML = `
                    <div id="root"></div>
                `;
      router();
      window.onNavigate(ROUTES_PATH["Bills"]);
      let b = new Bills({
        document,
        onNavigate,
        store: storeMock,
        localStorage,
      });
      let getBills = await b.getBills();
      let hum_date = [];
      getBills.forEach((bi) => hum_date.push(bi.date));

      document.getElementById("root").innerHTML = BillsUI({ data: bills });

      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      const datesSortedTranso = datesSorted.map((x) => formatDate(x));
      expect(datesSortedTranso).toEqual(hum_date);
    });

    test("Then clicking on the eye icon should display the modal with the bill image", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      await waitFor(() => screen.getAllByTestId("icon-eye"));
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      userEvent.click(eyeIcon);
      const modal = document.getElementById("modaleFile");
      expect(modal).toHaveClass("modal fade");
    });
    test("Then each bill should have a name, amount, date displayed", () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      root.innerHTML = BillsUI({ data: bills });
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      const billName = screen.getByText(bills[0].name);
      const billAmount = screen.getByText(`${bills[0].amount} €`);
      const billDate = screen.getByText(bills[0].date.toString());
      expect(billName).toBeInTheDocument();
      expect(billAmount).toBeInTheDocument();
      expect(billDate).toBeInTheDocument();
    });

    test("Then clicking on the New Bill button should navigate from Bills to New Bill", () => {
      expect(window.location.href).toBe("http://localhost/#employee/bills");
    });
  });
});
