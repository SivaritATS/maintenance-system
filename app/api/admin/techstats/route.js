import { pool } from "@/server";

export async function GET() {
  try {
    // 1. Get all technicians
    const [operators] = await pool.query("SELECT * FROM operators WHERE roles = 'technician'");
    
    // Check and reset scores if needed (reset if last_score_reset is not in the current month)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const todayStr = currentDate.toISOString().split('T')[0];
    
    let scoresUpdated = false;
    
    for (let op of operators) {
      if (op.last_score_reset) {
        const resetDate = new Date(op.last_score_reset);
        if (resetDate.getMonth() !== currentMonth || resetDate.getFullYear() !== currentYear) {
          // Reset score to 100 (or default score)
          await pool.query("UPDATE operators SET score = 100, last_score_reset = ? WHERE operator_id = ?", [todayStr, op.operator_id]);
          op.score = 100;
          op.last_score_reset = todayStr;
          scoresUpdated = true;
        }
      } else {
         // Initialize last_score_reset
         await pool.query("UPDATE operators SET last_score_reset = ? WHERE operator_id = ?", [todayStr, op.operator_id]);
         op.last_score_reset = todayStr;
      }
    }

    // 2. Get active & completed jobs
    const [fixs] = await pool.query("SELECT * FROM fixs WHERE operator IS NOT NULL");
    
    // 3. Get canceled jobs
    const [cancels] = await pool.query("SELECT * FROM jobs_cancellation");

    const stats = operators.map(tech => {
      const activeJobs = fixs.filter(f => f.operator === tech.operator_id && (f.fix_status === 'inprogress' || f.fix_status === 'approved' || f.fix_status === 'pending')); // wait, pending with operator? usually null, but include just in case.
      const completedJobs = fixs.filter(f => f.operator === tech.operator_id && f.fix_status === 'completed');
      
      // Admin rejected cancellation means technician is penalized, does the job stay with them? The code sets operator to null and status to approved. So the job is lost from them.
      const canceledJobs = cancels.filter(c => c.operator === tech.operator_id);
      
      // Wait! `fixs` filter above checks `f.operator === tech.operator_id`. 
      // If a job was taken and completed, it's in `fixs`.
      // If a job was taken and cancelled/failed, it's removed from `fixs.operator` (set to null) BUT it exists in `jobs_cancellation`!
      
      const completed = completedJobs.length;
      const failed = canceledJobs.length;
      const active = activeJobs.filter(f => f.fix_status !== 'completed').length;
      const totalTaken = completed + failed + active;

      return {
        id: tech.operator_id,
        name: tech.fnames + ' ' + tech.lnames,
        score: tech.score || 0,
        totalTaken,
        completed,
        failed,
        active,
      };
    });

    return Response.json(stats);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
