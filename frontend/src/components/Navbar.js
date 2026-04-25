import React from "react";
import { Link } from "react-router-dom";
import { Music } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Music className="w-6 h-6 text-primary-500" />
            MusicLens
          </Link>
        </div>
      </div>
    </nav>
  );
}
