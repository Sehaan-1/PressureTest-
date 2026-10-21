import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Modal } from "./Modal";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Open dialog
      </button>
      {open ? (
        <Modal title="Test dialog" onClose={() => setOpen(false)}>
          <button type="button">First field</button>
          <button type="button">Last action</button>
        </Modal>
      ) : null}
    </>
  );
}

describe("Modal keyboard behavior", () => {
  it("traps focus, closes on Escape, and restores focus to its opener", async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    const opener = screen.getByRole("button", { name: "Open dialog" });
    await user.click(opener);

    const close = screen.getByRole("button", { name: "Close dialog" });
    const lastAction = screen.getByRole("button", { name: "Last action" });
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastAction).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
