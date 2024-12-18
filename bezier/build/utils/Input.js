import Vector2D from "./Vector2D.js";
/**
 * Utility-Class for managing Inputs.
 *
 * To get started, call <b>Input.set_up_EventListeners()</b>
 *
 * Multiple keys can be bound to a single "action-name".
 *
 * For example, you can bind the keys (KeyboardEvent.key) "w" and "ArrowUp" the "move-up":
 *
 * <h6><b>Input.addAction("move-up", ["w", "ArrowUp"])<b></h6>
 *
 * Check if any of the keys bound to the Action is pressed by using:
 *
 * <h6><b>Input.is_action_pressed("action-name")<b></h6>
 *
 *You can also detect mouse clicks with the keys:
 *
 * <b>mouseLeft</b> and <b>mouseRight</b>
 */
class Input {
    static getMouseCoordinates() {
        return new Vector2D(this.mouseCoordinates.x, this.mouseCoordinates.y);
    }
    static getMousePositionOnCanvas(canvas) {
        let posOnWindow = Input.getMouseCoordinates();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return new Vector2D((posOnWindow.x - rect.left) * scaleX, (posOnWindow.y - rect.top) * scaleY);
    }
    /**
     * Set up Event Listeners for Mouse- and Keyboard-Inputs.
     */
    static set_up_EventListeners() {
        window.addEventListener("mousemove", (event) => {
            this.mouseCoordinates.x = event.clientX;
            this.mouseCoordinates.y = event.clientY;
        });
        window.addEventListener("mousedown", (event) => {
            switch (event.button) {
                case 0:
                    this.keys_pressed.add("mouseLeft");
                    break;
                case 2:
                    this.keys_pressed.add("mouseRight");
                    break;
            }
        });
        window.addEventListener("mouseup", (event) => {
            switch (event.button) {
                case 0:
                    this.keys_pressed.delete("mouseLeft");
                    break;
                case 2:
                    this.keys_pressed.delete("mouseRight");
                    break;
            }
        });
        window.addEventListener("keydown", (event) => {
            this.keys_pressed.add(event.key);
        });
        window.addEventListener("keyup", (event) => {
            this.keys_pressed.delete(event.key);
        });
    }
    /**
     * Adds a new Input-Action and binds it to one or several keys.
     * @param action_name Name of the action to be added (string).
     * @param keys The key or keys that you want to bind to the given action. (string[])
     */
    static add_action(action_name, keys) {
        // if action_name already exists
        if (this.keysBoundToAction.has(action_name)) {
            // get the keys assigned to action_name
            let action_values = this.keysBoundToAction.get(action_name);
            // put in the new keys removing duplicates
            action_values = Array.from(new Set(action_values.concat(keys)));
            this.keysBoundToAction.set(action_name, action_values);
        }
        else
            this.keysBoundToAction.set(action_name, keys);
    }
    /**
     * Checks if one of the keys bound to the given Action is pressed.
     * @param action_name Name of the Action (String)
     * @returns 1 if one of the keys is pressed, otherwise returns 0.
     */
    static is_action_pressed(action_name) {
        if (this.isDisabled(action_name))
            return 0;
        for (const key of this.keysBoundToAction.get(action_name)) {
            if (this.keys_pressed.has(key))
                return 1;
        }
        return 0;
    }
    /**
     * Disables the given Action, is_action_pressed will now return 0 until it is enabled again.
     * @param action_name Name of the Action to be disabled.
     */
    static disable_action(action_name) {
        if (this.keysBoundToAction.has(action_name)) {
            this.disabledActions.add(action_name);
        }
    }
    /**
     * Enables the given Action
     * @param action_name Name of the Action to be enabled.
     */
    static enable_action(action_name) {
        // return when the given action_name does not exist
        // OR when it is already enabled
        if (this.keysBoundToAction.has(action_name)) {
            this.disabledActions.delete(action_name);
        }
    }
    static toggle_disabled(action_name) {
        if (this.isDisabled(action_name)) {
            this.enable_action(action_name);
        }
        else {
            this.disable_action(action_name);
        }
    }
    static isDisabled(action_name) {
        return this.disabledActions.has(action_name);
    }
}
// contains all currently pressed keys
Input.keys_pressed = new Set();
// maps Actions to one or several keys
Input.keysBoundToAction = new Map();
// contains all currently disabled Actions
Input.disabledActions = new Set();
Input.mouseCoordinates = Vector2D.ZERO();
export default Input;
