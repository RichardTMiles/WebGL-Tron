
export default class BufferLoader {
    private context: AudioContext;
    private readonly urlList: string[];
    public bufferList: AudioBuffer[];
    private loadCount: number;

    constructor(context: AudioContext, urlList: string[]) {
        this.context = context;
        this.urlList = urlList;
        this.bufferList = [];
        this.loadCount = 0;
    }

    loadBuffer(url: string, index: number): void {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        let loader = this;

        request.onload = function() {
            loader.context.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    loader.bufferList[index] = buffer;
                }
            );
        }

        request.onerror = function() {
            alert('BufferLoader: XHR error');
        }

        request.send();
    }

    load(): void {
        for (let i = 0; i < this.urlList.length; ++i)
            this.loadBuffer(this.urlList[i], i);
    }
}