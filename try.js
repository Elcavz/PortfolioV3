$(document).ready(function(){
    // Highlight bottom nav links
    let clickEvent = false;

    $("#myCarousel").on("click", ".nav a", function(){
        clickEvent = true;
        $(this).parent().siblings().removeClass("active");
        $(this).parent().addClass("active");
    }).on("slid.bs.carousel", function(e){
        if (!clickEvent){
            const itemIndex = $(e.relatedTarget).index();
            const targetNavItem = $(".nav li[data-slide-to='" + itemIndex + "']");
            $(".nav li").not(targetNavItem).removeClass("active");
            targetNavItem.addClass("active");
        }
        clickEvent = false;
    });
});