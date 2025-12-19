import server
import time
import threading
from aiohttp import web



class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False


# Global dictionary to store execution events

STOP_AND_GO_REQUESTS = {}
STOP_AND_GO_RESPONSES = {}


class StopAndGoNode:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "input_data": (AnyType("*"),),
            },
            "hidden": {"unique_id": "UNIQUE_ID"},
        }

    RETURN_TYPES = (AnyType("*"),)
    RETURN_NAMES = ("output_data",)
    FUNCTION = "process"
    CATEGORY = "utils"

    def process(self, input_data, unique_id):

        request_id = f"{unique_id}_{int(time.time() * 1000)}"

        # Create an event to block execution
        event = threading.Event()
        STOP_AND_GO_REQUESTS[request_id] = event

        print(f"[StopAndGo] Pausing workflow at node {unique_id}. Waiting for user...")


        server.PromptServer.instance.send_sync(
            "stop_and_go_trigger", {"node_id": unique_id, "request_id": request_id}
        )


        event.wait()

        # Clean up
        action = STOP_AND_GO_RESPONSES.pop(request_id, "cancel")
        del STOP_AND_GO_REQUESTS[request_id]

        if action == "cancel":
            print("[StopAndGo] User cancelled execution.")

            raise Exception("Workflow stopped by user.")

        print("[StopAndGo] Resuming workflow.")
        return (input_data,)



@server.PromptServer.instance.routes.post("/stop_and_go/respond")
async def respond_to_stop(request):
    data = await request.json()
    request_id = data.get("request_id")
    action = data.get("action")  # "continue" or "cancel"

    if request_id in STOP_AND_GO_REQUESTS:
        STOP_AND_GO_RESPONSES[request_id] = action

        STOP_AND_GO_REQUESTS[request_id].set()
        return web.json_response({"status": "ok"})

    return web.json_response(
        {"status": "error", "message": "Request ID not found"}, status=404
    )


# Node Export
NODE_CLASS_MAPPINGS = {"StopAndGo": StopAndGoNode}

NODE_DISPLAY_NAME_MAPPINGS = {"StopAndGo": "⛔ Stop & Go (Preview Pauser)"}

WEB_DIRECTORY = "./js"