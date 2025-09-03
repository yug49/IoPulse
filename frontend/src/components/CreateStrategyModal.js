import React, { useState } from "react";
import { X } from "lucide-react";

const CreateStrategyModal = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: "",
        coin: "",
        description: "",
        initialAmount: "",
    });

    // Popular DeFi coins for the dropdown
    const availableCoins = [
        "BTC",
        "ETH",
        "BNB",
        "ADA",
        "SOL",
        "MATIC",
        "LINK",
        "UNI",
        "AVAX",
        "DOT",
        "LTC",
        "ICP",
        "SHIB",
        "WBTC",
        "DAI",
        "TRX",
        "ATOM",
        "ETC",
        "XMR",
        "XLM",
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (
            formData.title &&
            formData.coin &&
            formData.description &&
            formData.initialAmount
        ) {
            onSubmit(formData);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Create New Strategy</h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Strategy Name</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="e.g., Conservative Growth Strategy"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="coin">Current Investment</label>
                        <select
                            id="coin"
                            name="coin"
                            value={formData.coin}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select a cryptocurrency</option>
                            {availableCoins.map((coin) => (
                                <option key={coin} value={coin}>
                                    {coin}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="initialAmount">Initial Amount</label>
                        <input
                            type="number"
                            id="initialAmount"
                            name="initialAmount"
                            placeholder="e.g., 1.5"
                            value={formData.initialAmount}
                            onChange={handleInputChange}
                            step="0.0001"
                            min="0"
                            required
                        />
                        <small style={{ color: "#9ca3af", fontSize: "12px" }}>
                            Enter the amount of {formData.coin || "coins"} you
                            currently hold
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Investment Strategy Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Describe your investment goals, risk tolerance, and any specific preferences for the AI to consider..."
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            rows={4}
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="create-button">
                            Create Strategy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStrategyModal;
