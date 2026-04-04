import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Premium page now redirects to Account page Subscription tab.
 * All subscription management is centralized in Account.
 */
const Premium = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/app/subscription", { replace: true });
  }, [navigate]);

  return null;
};

export default Premium;
