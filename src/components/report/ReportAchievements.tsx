import React from "react";

interface Badge {
  id?: string;
  badge_id?: string;
  badge_name?: string;
  badge_description?: string | null;
  badge_category?: string;
  earned_at?: string;
}

interface ReportAchievementsProps {
  badges: Badge[];
}

const categoryIcons: Record<string, string> = {
  mastery: "🏆",
  milestone: "🎯",
  streak: "🔥",
  special: "⭐",
  general: "🏅",
};

export function ReportAchievements({ badges }: ReportAchievementsProps) {
  if (!badges || badges.length === 0) {
    return (
      <section className="report-page">
        <h2 className="report-section-title">Achievements & Milestones</h2>
        <p className="report-subtitle">Recognition of cognitive training accomplishments</p>
        <p className="no-badges">Complete training sessions to earn achievements.</p>
      </section>
    );
  }

  return (
    <section className="report-page">
      <h2 className="report-section-title">Achievements & Milestones</h2>
      <p className="report-subtitle">Recognition of cognitive training accomplishments</p>

      <div className="badges-grid">
        {badges.map((badge) => {
          const category = (badge.badge_category ?? "general").toLowerCase();
          const icon = categoryIcons[category] ?? "🏅";
          
          return (
            <div key={badge.badge_id ?? badge.id} className="badge-item">
              <span className="badge-icon">{icon}</span>
              <div className="badge-info">
                <span className="badge-name">{badge.badge_name ?? "Badge"}</span>
                {badge.earned_at && (
                  <span className="badge-date">
                    {new Date(badge.earned_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}