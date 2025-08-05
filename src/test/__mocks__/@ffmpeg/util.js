// Mock for @ffmpeg/util
const mockUtil = {
  fetchFile: jest.fn().mockImplementation(async (input) => {
    if (input instanceof Blob) {
      // Mock converting Blob to Uint8Array
      return new Uint8Array(Array.from(input.type || 'mock-blob').map(c => c.charCodeAt(0)));
    } else if (typeof input === 'string') {
      // Mock fetching file from URL
      return new Uint8Array([1, 2, 3, 4, 5]);
    } else {
      return new Uint8Array([1, 2, 3, 4, 5]);
    }
  }),
  
  toBlobURL: jest.fn().mockImplementation(async (url, mimeType) => {
    return `blob:${url}?mimeType=${mimeType}`;
  })
};

module.exports = mockUtil;