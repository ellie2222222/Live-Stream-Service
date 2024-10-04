import {
  IngressInput,
  IngressClient,
  IngressVideoEncodingPreset,
  RoomServiceClient,
  TrackSource,
  type CreateIngressOptions,
  IngressAudioEncodingPreset,
} from "livekit-server-sdk";
import { updateStream } from "./StreamService";

const LIVEKIT_API_URL = "https://live-stream-platform-1kj7rddo.livekit.cloud";
const LIVEKIT_API_KEY = "APIrazWZ8b8Yxm7";
const LIVEKIT_API_SECRET = "VEXMLfmp8jtcXrvMTO2SINiJUMecbnM1qhHnd0KcTEd";

const roomService = new RoomServiceClient(
  LIVEKIT_API_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

const ingressClient = new IngressClient(LIVEKIT_API_URL!);

export const resetIngresses = async (hostIdentity: string) => {
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

export const createIngressService = async (
  ingressType: IngressInput,
  user: any,
  streamId: any
) => {
  try {
    await resetIngresses(user._id);

    const ingress: CreateIngressOptions = {
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

    if (!response || !response.url || response.streamKey) {
      throw new Error("Failed to create ingress");
    }

    const updateData = {
      streamKey: response.streamKey,
      streamUrl: response.url,
      ingressId: response.ingressId,
    };

    await updateStream(streamId, updateData);
  } catch (error: any) {
    console.error(error);
  }
};

// module.exports = {
//   createIngressService
// }
