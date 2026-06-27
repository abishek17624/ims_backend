// routes/auth/refresh.router.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require('../config/db'); // Assuming db.js is in config folder

router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Get refresh token from cookie

  console.log('Refresh token request received');
  console.log('Refresh token present:', !!refreshToken);

  if (!refreshToken) {
    console.log('No refresh token provided');
    return res
      .status(401)
      .json({ success: 0, message: "No refresh token provided" });
  }

  try {
    console.log('Verifying refresh token...');
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log('Refresh token verified for user ID:', decoded.id);

    // Optional: Check if the user still exists in the DB for extra security
    const [rows] = await db.execute('SELECT id, email, role, name FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      console.log('User not found for refresh token');
      return res.status(403).json({ success: 0, message: "Refresh token user not found" });
    }
    const user = rows[0];
    console.log('User found:', user.email);

    // Re-generate payload with fresh user data
    const payload = {
        id: user.id,
        name: user.name || user.email.split('@')[0], 
        role: user.role,
        email: user.email,
        // Include other fields from the original token if needed
        email_verified: decoded.email_verified || false,
        mobile_verified: decoded.mobile_verified || false,
    };

    const newAccessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log('New access token generated successfully');

    // Set the new access token as HttpOnly cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "Lax", 
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.status(200).json({
      success: 1,
      message: "Token refreshed successfully",
      accessToken: newAccessToken, // Return new access token for Bearer auth in frontend
    });
  } catch (err) {
    console.error("Refresh token error:", err.message);
    
    // Clear cookies on any error
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });

    // Return appropriate error based on the type of error
    if (err.name === 'TokenExpiredError') {
      console.log('Refresh token expired');
      return res.status(403).json({ 
        success: 0, 
        message: "Refresh token expired",
        code: 'TOKEN_EXPIRED'
      });
    } else if (err.name === 'JsonWebTokenError') {
      console.log('Invalid refresh token');
      return res.status(403).json({ 
        success: 0, 
        message: "Invalid refresh token",
        code: 'INVALID_TOKEN'
      });
    } else {
      console.log('Unexpected refresh token error:', err);
      return res.status(500).json({ 
        success: 0, 
        message: "Internal server error during token refresh" 
      });
    }
  }
});

module.exports = router;