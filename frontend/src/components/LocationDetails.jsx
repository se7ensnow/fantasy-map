import React from "react";

export default function LocationDetails({ location }) {
    return (
        <div className="bg-[rgba(255,250,230,0.95)] border-2 border-amber-800 rounded-xl p-5 shadow-md space-y-3">
            <h3 className="text-2xl font-bold text-green-900">{location.name}</h3>
            <p className="text-amber-900"><span className="font-semibold">Type:</span> {location.type}</p>
            
            {location.description && (
                <p className="text-amber-900">
                    <span className="font-semibold">Description:</span> {location.description}
                </p>
            )}

            {location.metadata_json && Object.keys(location.metadata_json).length > 0 && (
                <div>
                    <p className="text-amber-900 font-semibold mb-1">Metadata:</p>
                    <pre className="bg-[rgba(255,245,210,0.9)] border border-amber-400 rounded p-3 text-sm text-amber-900 overflow-x-auto">
                        {JSON.stringify(location.metadata_json, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}