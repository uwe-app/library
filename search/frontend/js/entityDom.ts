import { assert } from "./util";
import { Result } from "./searchData";

import {
  create,
  add,
  clear,
  setText,
  existsBeyondContainerBounds
} from "./dom";
import { Entity } from "./entity";
import { ListItemDisplayOptions, resultToListItem } from "./resultToListItem";

interface ElementMap {
  input: HTMLInputElement;
  output: HTMLDivElement;
  progress: HTMLElement;
  list: HTMLElement;
  message: HTMLElement;
  closeButton: HTMLElement;
}

export interface RenderState {
  results: Array<Result>;
  resultsVisible: boolean;
  showScores: boolean;
  message: string | null;
  showProgress: boolean;
  progress: number | null;
}

const hiddenInterfaceRenderState: RenderState = {
  results: [],
  resultsVisible: false,
  showScores: false,
  message: null,
  showProgress: false,
  progress: 1
};

export class EntityDom {
  readonly elements: ElementMap;
  readonly entity: Entity;

  highlightedResult: number | null;
  hoverSelectEnabled: boolean;
  lastRenderState: RenderState;

  scrollAnchorPoint: "start" | "end" = "end";

  constructor(name: string, entity: Entity) {
    this.entity = entity;

    const input = document.querySelector(
      `input[data-search=${name}]`
    ) as HTMLInputElement;
    const output = document.querySelector(
      `div[data-search=${name}-output]`
    ) as HTMLDivElement;

    assert(
      input !== null,
      `Could not register search box "${name}": input element not found`
    );

    assert(
      output !== null,
      `Could not register search box "${name}": input element not found`
    );

    this.elements = {
      input: input,
      output: output,
      list: create("ul", { classNames: ["search-results"] }),
      progress: create("div", { classNames: ["search-progress"] }),
      message: create("div", { classNames: ["search-message"] }),
      closeButton: create("button", {
        classNames: ["search-close-button"]
      })
    };

    this.elements.input.addEventListener("input", e => {
      this.handleInputEvent(e as InputEvent);
    });

    this.elements.input.addEventListener("keydown", e => {
      this.handleKeyDownEvent(e as KeyboardEvent);
    });

    add(this.elements.list, "beforeend", this.elements.output);
    this.elements.list?.addEventListener("mousemove", () => {
      this.hoverSelectEnabled = true;
    });

    setText(this.elements.closeButton, "×");

    add(this.elements.progress, "afterend", this.elements.input);

    this.elements.closeButton?.addEventListener("click", () => {
      this.elements.input.value = "";
      this.elements.input.focus();
      this.render(hiddenInterfaceRenderState);
    });
  }

  private clearDom() {
    clear(this.elements.output);
    clear(this.elements.list);
    this.elements.closeButton?.remove();
    this.elements.output.classList.remove("search-output-visible");
  }

  render(state: RenderState): void {
    const query = (this.elements.input as HTMLInputElement).value;
    this.clearDom();
    this.lastRenderState = state;

    if (state.showProgress && state.progress && state.progress < 1) {
      this.elements.progress.style.width = `${state.progress * 100}%`;
    } else if (state.showProgress) {
      this.elements.progress.style.width = `100%`;
      this.elements.progress.style.opacity = "0";
    }

    if (this.getQuery().length > 0 && state.resultsVisible) {
      this.elements.output.classList.add("search-output-visible");
      add(this.elements.message, "beforeend", this.elements.output);
    }

    if (state.message) {
      setText(this.elements.message, state.message);
    }
    // this.elements.message.textContent = state.message;
    if (state.results?.length > 0 && state.resultsVisible) {
      add(this.elements.list, "beforeend", this.elements.output);

      for (let i = 0; i < state.results.length; i++) {
        const result = state.results[i];
        const generateOptions: ListItemDisplayOptions = {
          selected: i === this.highlightedResult,
          showScores: state.showScores
        };

        const listItem = resultToListItem(result, generateOptions);
        add(listItem as HTMLElement, "beforeend", this.elements.list);
        // const insertedElement = this.elements.list?.appendChild(
        //   resultToListItem(result, generateOptions) ||
        //     document.createElement("li")
        // );

        listItem.addEventListener("mousemove", () => {
          if (this.hoverSelectEnabled) {
            if (i !== this.highlightedResult) {
              this.changeHighlightedResult({ to: i, shouldScrollTo: false });
            }
          }
        });
      }
    }

    if ((query?.length || 0) > 0) {
      add(this.elements.closeButton, "afterend", this.elements.input);
    }
  }

  changeHighlightedResult(options: {
    to: number;
    shouldScrollTo: boolean;
  }): number {
    const previousValue = this.highlightedResult;

    const resolvedIdx = Math.max(
      0,
      Math.min(this.entity.results.length - 1, options.to)
    );

    this.highlightedResult = resolvedIdx;
    this.scrollAnchorPoint =
      (previousValue || 0) < resolvedIdx ? "end" : "start";

    let targetForScrollTo = null;

    for (let i = 0; i < this.entity.results.length; i++) {
      const element = this.elements.list?.children[i];
      if (!element) {
        continue;
      }

      const highlightedClassName = "selected";

      if (i == resolvedIdx) {
        element.classList.add(highlightedClassName);
        targetForScrollTo = element;
      } else {
        element.classList.remove(highlightedClassName);
      }
    }

    // using options.by as a proxy for keyboard selection
    if (options.shouldScrollTo) {
      this.hoverSelectEnabled = false;
      if (targetForScrollTo) {
        if (
          existsBeyondContainerBounds(
            targetForScrollTo as HTMLElement,
            this.elements.list
          )
        ) {
          (targetForScrollTo as HTMLElement).scrollIntoView({
            behavior: "smooth",
            block: this.scrollAnchorPoint,
            inline: "nearest"
          });
        }
      }
    }

    return resolvedIdx;
  }

  handleKeyDownEvent(event: KeyboardEvent): void {
    const UP = 38;
    const DOWN = 40;
    const RETURN = 13;
    const ESC = 27;

    switch (event.keyCode) {
      case DOWN: {
        if (typeof this.highlightedResult != "number") {
          this.changeHighlightedResult({ to: 0, shouldScrollTo: true });
        } else {
          const target = Math.min(
            this.highlightedResult + 1,
            this.entity.results.length - 1
          );
          this.changeHighlightedResult({ to: target, shouldScrollTo: true });
        }
        break;
      }

      case UP: {
        if (typeof this.highlightedResult != null) {
          assert(typeof this.highlightedResult === "number");
          const target = Math.max(0, this.highlightedResult - 1);
          this.changeHighlightedResult({ to: target, shouldScrollTo: true });
        }
        break;
      }

      case RETURN:
        if (typeof this.highlightedResult != null) {
          assert(typeof this.highlightedResult === "number");
          window.location.assign(
            this.entity.results[this.highlightedResult].entry.url
          );
        }
        break;

      case ESC:
        if (!this.lastRenderState.resultsVisible) {
          this.elements.input.value = "";
        }
        this.render(hiddenInterfaceRenderState);
        break;

      default:
        return;
    }
  }

  handleInputEvent(event: InputEvent): void {
    this.entity.performSearch((event.target as HTMLInputElement).value);
  }

  getQuery(): string {
    return (this.elements.input as HTMLInputElement).value;
  }
}
