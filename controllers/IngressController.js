import { IngressInput, IngressVideoEncodingPreset, IngressAudioEncodingPreset, IngressClient, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { updateStream } from "../services/StreamService.js";

const LIVEKIT_API_URL = "https://live-stream-platform-1kj7rddo.livekit.cloud";
const LIVEKIT_API_KEY = "APIrazWZ8b8Yxm7";
const LIVEKIT_API_SECRET = "VEXMLfmp8jtcXrvMTO2SINiJUMecbnM1qhHnd0KcTEd";

const roomService = new RoomServiceClient(
  LIVEKIT_API_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

const ingressClient = new IngressClient(LIVEKIT_API_URL);

const resetIngresses = async (hostIdentity) => {
    const ingresses = await ingressClient.listIngress({
        roomName: hostIdentity,
    });

    const rooms = await roomService.listRooms([hostIdentity]);

    for (const room of rooms) {
        await roomService.deleteRoom(room.name);
    }

    for (const ingress of ingresses) {
        if (ingress.ingressId) {
            await ingressClient.deleteIngress(ingress.ingressId);
        }
    }
};

class IngressController {
    async updateStream(req, res) {
        const { streamId } = req.params;
        const { user, ingressType } = req.body;

        try {
            await resetIngresses(user._id);

            const ingress = {
                name: user.name,
                roomName: user._id,
                participantIdentity: user._id,
                participantName: user.name,
            };

            if (ingressType === IngressInput.WHIP_INPUT) {
                ingress.bypassTranscoding = true;
            } else {
                ingress.video = {
                    source: TrackSource.CAMERA,
                    preset: IngressVideoEncodingPreset.H264_1080P_30FPS_3_LAYERS,
                };
                ingress.audio = {
                    source: TrackSource.MICROPHONE,
                    preset: IngressAudioEncodingPreset.OPUS_STEREO_96KBPS,
                };
            }

            const response = await ingressClient.createIngress(ingressType, ingress);
            console.log(response)

            const updateData = {
                streamKey: response.streamKey,
                streamUrl: response.url,
                ingressId: response.ingressId,
            };

            const stream = await updateStream(streamId, updateData);

            res.status(200).json({ data: stream, message: "Stream updated successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default IngressController;