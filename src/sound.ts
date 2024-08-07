import BufferLoader from "./lib/BufferLoader";

// Create an AudioContext instance
export const ctx = new AudioContext();

// Initialize BufferLoader with the AudioContext and an array of sound file URLs
export const bufferLoader = new BufferLoader(
    ctx,
    [
        require("url:/sounds/eng1.ogg"),
        require("url:sounds/eng1.ogg"),
        require("url:sounds/eng2.ogg"),
        require("url:sounds/eng3.wav"),
        require("url:sounds/eng4.ogg"),
        require("url:sounds/eng5.wav"),
        require("url:sounds/crash1.wav"),
        require("url:sounds/rubberHit.mp3"),
        require("url:sounds/wallCollapse.mp3"),
        require("url:sounds/crash2.wav"),
        require("url:sounds/crash3.wav"),
        require("url:sounds/riser2.wav")
    ]
);

// Load the audio buffers
bufferLoader.load();

export interface iPlaySoundReturn extends AudioBufferSourceNode {
    gainNode?: GainNode
}

// Define the playSound function with specified types
export const playSound = function (
    buffer: AudioBuffer,  // Audio buffer to play
    vol: number,         // Volume level (0.0 to 1.0)
    pitch: number,       // Playback rate
    loop: boolean,       // Loop the audio (true/false)
    output: AudioNode    // Audio node to connect the sound output to
): iPlaySoundReturn {  // Return type: AudioBufferSourceNode

    // Create an AudioBufferSourceNode to play the audio buffer
    const src: Partial<iPlaySoundReturn> = ctx.createBufferSource();

    // Create a GainNode to control the volume
    const gainNode: GainNode = ctx.createGain();

    src.gainNode = ctx.createGain();

    // Connect the AudioBufferSourceNode to the GainNode
    src.connect(gainNode);

    // Connect the GainNode to the specified output
    gainNode.connect(output);

    // Set the buffer for the AudioBufferSourceNode
    src.buffer = buffer;

    // Set the gain value for the GainNode
    gainNode.gain.value = vol;

    // Set the playback rate for the AudioBufferSourceNode
    src.playbackRate.value = pitch;

    // Set the loop property for the AudioBufferSourceNode
    src.loop = loop;

    // Start the AudioBufferSourceNode at the current time
    src.start(ctx.currentTime);

    // Return the AudioBufferSourceNode
    return src as iPlaySoundReturn;

};
