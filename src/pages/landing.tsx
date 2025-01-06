import React from "react";
import { Box, Button, Typography, Container } from "@mui/material";
import DishSlider from "../components/dish-slider";

const LandingPage = () => {
  // Google Analytics Tracking
  // React.useEffect(() => {
  //   window.dataLayer = window.dataLayer || [];
  //   function gtag() { window.dataLayer.push(arguments); }
  //   gtag("js", new Date());
  //   gtag("config", "G-2PPH12EZSP", { page_path: "/instagram-landing" });
  // }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/imgs/black-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        paddingBottom: "20px",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px",
        }}
      >
        <Box component="img" src="/imgs/logo.png" alt="Logo" sx={{ width: 150 }} />
        <Button
          href="https://wa.me/919643310092"
          target="_blank"
          rel="noopener noreferrer"
          // onClick={() =>
          //   gtag("event", "click", { event_category: "instagram_promotion", event_label: "whatsapp" })
          // }
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#25d366",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            padding: "5px 10px",
            borderRadius: "5px",
            maxHeight: "40px",
            "&:hover": { backgroundColor: "#1ebe5b" },
          }}
        >
          <Box component="img" src="/imgs/whats_app.svg" alt="WhatsApp" sx={{ width: 20, mr: 1 }} />
          +91 9643310092
        </Button>
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: 148,
          left: "15%",
          transform: "translateX(-50%)",
          backgroundImage: "url('/imgs/50-per-off-ribbon.png') ", // Change to your image path
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          color: "white",
          padding: "12px 24px",
          borderRadius: "8px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "66px", // Ensures visibility
          height: "77px",
          zIndex: 2
        }}
      />

      {/* Rotating Image */}
      <DishSlider />
      {/* <Box
        component="img"
        src="/imgs/food-gif.png"
        alt="Food Platter"
        sx={{
          width: 300,
          height: 300,
          objectFit: "cover",
          animation: "spin 100s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
        }}
      /> */}

      {/* Order Buttons */}
      <Container sx={{ textAlign: "center", mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
          Order on
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            component="a"
            href="https://link.zomato.com/xqzv/rshare?id=9438730630563d53"
            target="_blank"
            rel="noopener noreferrer"
            // onClick={() =>
            //   gtag("event", "click", { event_category: "instagram_promotion", event_label: "zomato" })
            // }
            sx={{ background: "transparent", padding: 0 }}
          >
            <Box component="img" src="/imgs/zomato-button.jpg" alt="Zomato" sx={{ width: 120 }} />
          </Button>

          <Button
            component="a"
            href="https://www.swiggy.com/direct/brand/48321?source=swiggy-direct&subSource=instagram"
            target="_blank"
            rel="noopener noreferrer"
            // onClick={() =>
            //   gtag("event", "click", { event_category: "instagram_promotion", event_label: "swiggy" })
            // }
            sx={{ background: "transparent", padding: 0 }}
          >
            <Box component="img" src="/imgs/swiggy-button.jpg" alt="Swiggy" sx={{ width: 120 }} />
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
