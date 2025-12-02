import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Check, Award, Trophy } from "lucide-react";

export default function GameRules({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Game Rules</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5"/></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold flex items-center"><Check className="w-5 h-5 mr-2 text-green-600"/>Making Picks</h3>
                <p className="text-slate-600 text-sm">For each game, you must make a combined pick: select one team to cover the point spread AND choose if the total points will be Over or Under the line.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold flex items-center"><Award className="w-5 h-5 mr-2 text-blue-600"/>Scoring</h3>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 mt-2">
                    <li><span className="font-bold">1 Point:</span> Awarded if you correctly predict BOTH the spread winner AND the over/under.</li>
                    <li><span className="font-bold">0.5 Points:</span> Awarded if one of your picks is correct and the other is a "push" (a tie).</li>
                    <li><span className="font-bold">0 Points:</span> Awarded for all other outcomes (e.g., one win & one loss, two losses, two pushes).</li>
                </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold flex items-center"><Trophy className="w-5 h-5 mr-2 text-yellow-500"/>Super Bowl Tiebreaker</h3>
                <p className="text-slate-600 text-sm">For the Super Bowl, you must also guess the total combined points scored. This is used as a tiebreaker for the final season standings.</p>
            </div>
            <div className="text-center mt-6">
                <Button onClick={onClose}>Got it!</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}