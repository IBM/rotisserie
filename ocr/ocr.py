import io
import os
import uuid

from sanic import Sanic
from sanic.response import json
import tensorflow as tf
from PIL import Image

app = Sanic()


def load_graph(graph_file):
    """
    Load a frozen TensorFlow graph
    """
    with tf.gfile.GFile(graph_file, "rb") as f:
        graph_def = tf.GraphDef()
        graph_def.ParseFromString(f.read())

    with tf.Graph().as_default() as graph:
        tf.import_graph_def(graph_def)

    return graph


app.graph = load_graph("./model.pb")
app.ocr_debug = os.environ.get("OCR_DEBUG", False)


@app.route("/info", methods=["GET"])
async def info(request):
    return json({
        "app": "ocr",
        "version": "0.2",
        "health": "good"
    })


@app.route("/process_pubg", methods=["POST"])
async def process_pubg(request):
    if not request.files:
        return json({
            "number": 100
        })

    image_data = request.files.get("image").body

    im = Image.open(io.BytesIO(image_data)).convert('L')
    px = im.load()

    left = px[15, 9]
    center = px[16,9]
    right = px[17,9]

    # Before a game has started the top right looks like:
    # XX | Joined
    # Where XX is the number of players.
    #
    # The area we crop assumes it looks like:
    # XX | Alive
    #
    # Because 'joined' has one more character than 'alive' it causes
    # the leftmost number to be shifted outside of our capture area.
    # When this happens the model correctly identifies the only number
    # it sees causing that stream to be erroneously marked as the one
    # with the fewest players. E.g. 96 | Joined will be cropped into
    # 6 | which will be identified as 6 instead of 96.
    #
    # To remedy this we can check for the prescence of a vertical line
    # and return 100 for those streams. If a bar is present then the game
    # has not started and we can safely assume this stream does not have
    # the fewest remaining players.
    #
    # values are low (dark) to high (light) so a high, low, high sequence
    # of pixels is what a line looks like
    #
    # if left and right are within 10%
    # AND
    # if center is 25% less than left and right
    # that looks like a line
    if 0.90 * right < left < 1.10 * right:
        if center < 0.75 * right:
            if app.ocr_debug:
                print("Skipping possible 'joined' image.")

            return json({
                "number": 100
            })

    config = tf.ConfigProto(allow_soft_placement=True)
    with tf.Session(graph=app.graph, config=config) as sess:
        img_pl = app.graph.get_tensor_by_name("import/input_image_as_bytes:0")
        input_feed = {img_pl: image_data}
        output_feed = [
            app.graph.get_tensor_by_name("import/prediction:0"),
            app.graph.get_tensor_by_name("import/probability:0")
        ]

        res = sess.run(output_feed, input_feed)
        try:
            number = int(res[0])
        except ValueError:
            number = 100

    if app.ocr_debug:
        filename = "debug/{}_{}.png".format(uuid.uuid4(), number)
        with open(filename, 'wb') as f:
            f.write(image_data)

        print("Identified image {} as {} with {:5.2f}% probability.".format(
            filename, number, res[1] * 100))

    return json({
        "number": number
    })


if __name__ == "__main__":
    cpus = len(os.sched_getaffinity(0))
    app.run(host="0.0.0.0", port=3001, workers=cpus)
