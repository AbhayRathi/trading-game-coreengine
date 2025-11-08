
import React, { useState, useCallback } from 'react';
import { editImageWithPrompt } from '../services/geminiService';
import { Upload, Wand2, X, Loader } from 'lucide-react';

interface ImageEditorProps {
  onClose: () => void;
  onImageUpdate: (newImageUrl: string) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ onClose, onImageUpdate }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove the header from the base64 string
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
  }

  const handleGenerate = useCallback(async () => {
    if (!file || !prompt) {
        setError("Please upload an image and provide a prompt.");
        return;
    }
    setIsLoading(true);
    setError('');
    setEditedImage(null);

    try {
        const base64Image = await fileToBase64(file);
        const editedBase64 = await editImageWithPrompt(base64Image, file.type, prompt);
        setEditedImage(`data:${file.type};base64,${editedBase64}`);
    } catch (err) {
        console.error("Image editing failed:", err);
        setError("Failed to edit image. Please try again.");
    } finally {
        setIsLoading(false);
    }
  }, [file, prompt]);
  
  const handleApply = () => {
    if (editedImage) {
      onImageUpdate(editedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-purple-400/50 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] p-6 flex flex-col"
          style={{ boxShadow: '0 0 30px rgba(192, 132, 252, 0.3)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-orbitron text-2xl text-purple-300">Gemini Image Editor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left Side: Controls & Original Image */}
          <div className="flex flex-col gap-4">
            <label htmlFor="image-upload" className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors">
              {originalImage ? (
                <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
              ) : (
                <>
                  <Upload className="text-gray-400 mb-2" />
                  <span className="text-gray-400">Click to upload image</span>
                </>
              )}
            </label>
            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Add a retro filter' or 'Make the sky look like a galaxy'"
              className="w-full h-24 p-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-white"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !originalImage || !prompt}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader className="animate-spin" /> : <Wand2 />}
              {isLoading ? 'Generating...' : 'Generate Edit'}
            </button>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </div>

          {/* Right Side: Edited Image */}
          <div className="bg-gray-800/50 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] p-4 gap-4">
            {isLoading && <Loader size={48} className="text-purple-400 animate-spin" />}
            {!isLoading && editedImage && (
              <img src={editedImage} alt="Edited" className="flex-grow w-full h-auto object-contain min-h-0" />
            )}
            {!isLoading && !editedImage && <p className="text-gray-500">Edited image will appear here</p>}
            {!isLoading && editedImage && (
              <button
                onClick={handleApply}
                className="w-full flex-shrink-0 py-2 px-4 bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Apply as Background
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;