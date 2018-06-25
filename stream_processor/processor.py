import ffmpeg
import json
import redis
import requests
import os
import subprocess
import time


db = redis.StrictRedis(host='redis-master',
                       password=os.getenv('REDIS_PASSWORD'))

# This is a redis set that contains a list of stream names
read_key = os.getenv('REDIS_READ_KEY', 'stream-list')

# Results are written to a sorted set. Sorted sets contain a string
# and a score and are sorted in ascending order based on the score.
# This makes it so the list of streams is always sorted by remaining players.
write_key = os.getenv('REDIS_WRITE_KEY', 'stream-by-alive')

# Twitch OAUTH token
token = os.getenv("TOKEN")

# Twitch streams have lots of variations on 720p and some streams
# don't even have that. If we don't specify one of the available formats
# streamlink will fail. It will also fallback to 'best' or 'source' if nothing
# else can be found, though those aren't guaranteed to be valid either.
aliases = ','.join(["720", "720p", "720p60", "720p60_alt", "best", "source"])


def main():
    """Main loop

    Loops and pops values from the set of streams. For each of those streams
    it captures 4 seconds of the video, captures a screenshot of the first
    frame and submits it to the OCR service to get a value. That value, along
    with the stream name is added to the sorted set of parsed streams.
    """
    while True:
        stream_name = db.spop(read_key)

        # Out of streams, wait 5 seconds and check again
        if not stream_name:
            time.sleep(5)
            continue

        stream_name = stream_name.decode('utf-8')
        print(stream_name)

        if not stream_name:
            continue

        try:
            subprocess.run(["streamlink", "--twitch-oauth-token", token,
                            "-Q", "-f", "-o", "{}.mp4".format(stream_name),
                            "twitch.tv/{}".format(stream_name), aliases],
                           check=True, timeout=4)
        except subprocess.CalledProcessError as e:
            print(e)
            continue
        except subprocess.TimeoutExpired:
            # This is expected. We're using the timeout in subprocess.run
            # to only capture 4 seconds of video.
            pass

        screenshot = take_screenshot(stream_name)
        if not screenshot:
            continue

        value = ocr(screenshot)

        db.zadd(write_key, value, stream_name)

        os.unlink("{}.mp4".format(stream_name))


def take_screenshot(stream_name):
    img = ffmpeg.input('{}.mp4'.format(stream_name))
    img = ffmpeg.crop(img, 1190, 20, 22, 22)
    img = ffmpeg.output(img, "pipe:", vframes=1, format="image2",
                        vcodec="png", pix_fmt="gray")
    try:
        img, err = ffmpeg.run(img, capture_stdout=True, quiet=True,
                              capture_stderr=True)
    except Exception:
        return

    if err:
        print(err)

    return img


def ocr(file_data):
    files = {'image': file_data}
    req = requests.post("http://rotisserie-ocr:3001/process_pubg", files=files)

    data = json.loads(req.text)
    return data['number']


if __name__ == "__main__":
    main()
