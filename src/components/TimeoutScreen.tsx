import { useEffect, useState } from "react";

const TimeoutScreen = () => {
  const [selectedAd, setSelectedAd] = useState<string>("");

  useEffect(() => {
    const ads = ["allfoods.png", "image.png", "water.png"]; // Add your image filenames here
    const randomIndex = Math.floor(Math.random() * ads.length);
    setSelectedAd(`assets/ads/${ads[randomIndex]}`);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      {selectedAd && (
        <img
          src={selectedAd}
          alt="Advertisement"
          style={{ maxHeight: "100vw", marginTop: "2rem" }}
        />
      )}
    </div>
  );
};

export default TimeoutScreen;
